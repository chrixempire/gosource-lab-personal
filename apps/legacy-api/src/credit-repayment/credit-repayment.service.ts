import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  CreditAccount,
  CreditAccountDocument,
} from '../credit/schema/creditAccount.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  RepaymentSchedule,
  RepaymentScheduleDocument,
} from '../credit/schema/repaymentSchedule.schema';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import {
  PaymentMethod,
  PaymentRefStatus,
  RepaymentStatus,
} from '../credit/enum/repayment.enum';
import {
  CreditRequest,
  CreditRequestDocument,
} from '../credit/schema/creditRequest';
import { WalletService } from '../wallet/wallet.service';
import { generateRandomCode } from '../utils/helpers';
import { CreditPaymentReference } from '../credit/schema/creditPaymentReference.schema';
import { successResponse } from '../utils/responses';
import {
  BulkProcessPaymentDto,
  PaymentAdminApprovalDto,
} from '../credit/dto/repayment.dto';
import { IPaymentResult } from '../credit/interface/repayment.interface';
import { PaymentReference } from '../paystack/schema/paymentReference.schema';
import { CreditStatus } from '../credit/enum/credit.enum';
import { createMoney } from '../utils/money';
import { PaystackService } from '../paystack/paystack.service';
import { resolvePaystackCreditAccountId } from '../paystack/paystack-metadata.helpers';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../jobs/constants';
import { AccountingService } from '../accounting/accounting.service';
import { sumPrincipalRemainingKobo } from './credit-repayment-schedule.helpers';

@Injectable()
export class CreditRepaymentService {
  constructor(
    @InjectModel(CreditAccount.name)
    private creditAccountModel: Model<CreditAccount>,
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    @InjectModel(RepaymentSchedule.name)
    private repaymentScheduleModel: Model<RepaymentSchedule>,
    @InjectModel(CreditPaymentReference.name)
    private paymentReferenceModel: Model<CreditPaymentReference>,
    private walletService: WalletService,
    @InjectModel(PaymentReference.name)
    private paystackPaymentReferenceModel: Model<PaymentReference>,
    @Inject(forwardRef(() => PaystackService))
    private paystackService: PaystackService,
    @InjectQueue(QUEUE_NAMES.CREDIT_REPAYMENT) private creditQueue: Queue,
    @InjectConnection() private readonly connection: Connection,
    private accountingService: AccountingService,
  ) {}

  // CUSTOMER ENTRY POINT - Make payment based on different payment methods
  async makePayment(
    paymentData: BulkProcessPaymentDto,
    creditAccount: CreditAccountDocument,
  ) {
    const { paymentMethod } = paymentData;

    let paymentResult: IPaymentResult;
    let message = 'Payment completed successfully';

    switch (paymentMethod) {
      case PaymentMethod.WALLET:
        paymentResult = await this.processWalletPayment(
          paymentData,
          creditAccount,
        );
        break;

      case PaymentMethod.BANK_TRANSFER:
        paymentResult = await this.processBankTransferPayment(
          paymentData,
          creditAccount,
        );
        message =
          'Payment pending admin approval. Please wait for confirmation after submitting proof.';
        break;

      case PaymentMethod.CARD:
        paymentResult = await this.processCardPayment(
          paymentData,
          creditAccount,
        );
        break;

      default:
        throw new BadRequestException(
          `Unsupported payment method: ${paymentMethod}`,
        );
    }

    // TODO: Log payment activity

    return successResponse(message, paymentResult);
  }

  async processWalletPayment(
    paymentData: BulkProcessPaymentDto,
    creditAccount: CreditAccountDocument,
  ) {
    const { paymentAmount } = paymentData;
    const reference = generateRandomCode();
    // Validate payment amount
    if (paymentAmount < 1000) {
      throw new BadRequestException('Payment amount is too low');
    }

    // Deduct from wallet
    await this.walletService.repayCreditFromWallet(
      creditAccount.business.toString(),
      paymentAmount,
      reference,
    );

    // Create completed payment record.
    await this.paymentReferenceModel.create({
      referenceCode: reference,
      creditAccount: creditAccount._id,
      business: creditAccount.business,
      amountKobo: createMoney(paymentAmount, 'naira').kobo,
      paymentMethod: PaymentMethod.WALLET,
      status: PaymentRefStatus.COMPLETED,
    });

    // Process payment allocation
    const paymentResult = await this.processPaymentCore({
      ...paymentData,
      paymentAmount: createMoney(paymentAmount, 'naira').kobo,
      transactionReference: reference,
    });

    // Send notifications
    await this.sendRepaymentNotifications(
      creditAccount._id.toString(),
      paymentAmount * 100, // convert to kobo for wallet
      PaymentMethod.WALLET,
      reference,
    );

    return paymentResult;
  }

  async processBankTransferPayment(
    paymentData: BulkProcessPaymentDto,
    creditAccount: CreditAccountDocument,
  ) {
    const { paymentAmount, paymentNote } = paymentData;
    const reference = generateRandomCode();

    const pendingTransfer = await this.paymentReferenceModel.findOne({
      creditAccount: creditAccount._id,
      status: PaymentRefStatus.PENDING_APPROVAL,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
    });

    if (pendingTransfer) {
      throw new BadRequestException(
        'You have a pending bank transfer payment. Please wait for approval before making another payment.',
      );
    }

    // Create pending payment record
    await this.paymentReferenceModel.create({
      referenceCode: reference,
      creditAccount: creditAccount._id,
      business: creditAccount.business,
      amountKobo: createMoney(paymentAmount, 'naira').kobo,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentRefStatus.PENDING_APPROVAL,
      paymentNote: paymentNote,
      metadata: {
        requiresAdminApproval: true,
        proofRequired: true,
      },
    });

    // Notify admin for approval - TODO: Implement actual notification logic

    // TODO: Notify customer of next steps - pending approval

    return {
      paymentStatus: PaymentRefStatus.PENDING_APPROVAL,
      transactionReference: reference,
    };
  }

  async processCardPayment(
    paymentData: BulkProcessPaymentDto,
    creditAccount: CreditAccountDocument,
  ) {
    const { transactionReference } = paymentData;

    try {
      if (!transactionReference) {
        throw new BadRequestException(
          'Transaction reference is required for card payments',
        );
      }

      let pendingPayment = await this.paymentReferenceModel.findOne({
        referenceCode: transactionReference,
      });

      // Fallback: If not in DB, verify with Paystack manually
      if (!pendingPayment) {
        let paystackData =
          await this.paystackService.verifySuccessfulCharge(transactionReference);

        if (!paystackData) {
          for (let attempt = 0; attempt < 5; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            paystackData =
              await this.paystackService.verifySuccessfulCharge(transactionReference);
            if (paystackData) {
              break;
            }
          }
        }

        if (!paystackData) {
          throw new BadRequestException(
            'Payment verification failed. Please contact support if you have been debited.',
          );
        }

        // Check if this payment actually belongs to this credit account
        const metadataCreditAccountId = resolvePaystackCreditAccountId(
          paystackData.metadata,
        );
        const accountId = String(creditAccount._id);
        if (
          metadataCreditAccountId &&
          metadataCreditAccountId !== accountId
        ) {
          throw new BadRequestException(
            'Transaction reference mismatch. This payment does not belong to this credit account.',
          );
        }

        pendingPayment = await this.paymentReferenceModel.create({
          referenceCode: transactionReference,
          creditAccount: creditAccount._id,
          business: creditAccount.business,
          amountKobo: paystackData.amount, // paystack uses kobo
          paymentMethod: PaymentMethod.CARD,
          status: PaymentRefStatus.PENDING_APPROVAL,
        });

        await this.paystackPaymentReferenceModel.updateOne(
          { data: transactionReference },
          { data: transactionReference },
          { upsert: true },
        );
      }

      if (pendingPayment.status === PaymentRefStatus.COMPLETED) {
        return {
          success: true,
          totalPaid: pendingPayment.amountKobo,
          transactionReference,
        };
      }

      return await this.internalProcessCardPayment(
        pendingPayment,
        transactionReference,
      );
    } catch (error: any) {
      if (transactionReference) {
        const completed =
          await this.getCompletedCardPaymentResult(transactionReference);
        if (completed) {
          return completed;
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }

      const response =
        error?.response ??
        (typeof error?.getResponse === 'function' ? error.getResponse() : undefined);
      const message = this.resolveCardPaymentErrorMessage(error, response);

      throw new HttpException(message, error?.status ?? error?.getStatus?.() ?? 500);
    }
  }

  private resolveCardPaymentErrorMessage(
    error: unknown,
    response: unknown,
  ): string {
    if (typeof response === 'string' && response.trim()) {
      return response;
    }

    if (Array.isArray((response as { message?: unknown })?.message)) {
      return (response as { message: string[] }).message.join(', ');
    }

    const nestedMessage = (response as { message?: unknown })?.message;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage;
    }

    if (this.isMongoWriteConflict(error)) {
      return 'Payment is still being recorded. Please refresh your credit page in a moment.';
    }

    const axiosMessage = String((error as { message?: string })?.message ?? '');
    if (/^Request failed with status code \d+$/i.test(axiosMessage)) {
      return 'Payment verification failed. Please contact support if you have been debited.';
    }

    return (
      axiosMessage || 'An error occurred during payment processing'
    );
  }

  /**
   * Internal helper to process a verified card payment
   */
  private isMongoWriteConflict(error: unknown): boolean {
    const err = error as { code?: number; message?: string };
    const message = String(err?.message ?? '');
    return err?.code === 112 || /write conflict/i.test(message);
  }

  private async getCompletedCardPaymentResult(
    transactionReference: string,
  ): Promise<IPaymentResult | null> {
    const completed = await this.paymentReferenceModel.findOne({
      referenceCode: transactionReference,
      status: PaymentRefStatus.COMPLETED,
    });

    if (!completed) {
      return null;
    }

    return {
      success: true,
      totalPaid: completed.amountKobo,
      transactionReference,
    };
  }

  private async internalProcessCardPayment(
    pendingPayment: { _id: Types.ObjectId },
    transactionReference: string,
  ): Promise<IPaymentResult> {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const session = await this.connection.startSession();
      session.startTransaction();

      try {
        const paymentRecord = await this.paymentReferenceModel
          .findById(pendingPayment._id)
          .session(session);

        if (!paymentRecord) {
          throw new NotFoundException('Payment record not found');
        }

        if (paymentRecord.status === PaymentRefStatus.COMPLETED) {
          await session.abortTransaction();
          return {
            success: true,
            totalPaid: paymentRecord.amountKobo,
            transactionReference,
          };
        }

        paymentRecord.status = PaymentRefStatus.COMPLETED;
        await paymentRecord.save({ session });

        const paymentCompleted = await this.processPaymentCore(
          {
            creditAccountId: paymentRecord.creditAccount.toString(),
            paymentAmount: paymentRecord.amountKobo,
            paymentMethod: paymentRecord.paymentMethod,
            transactionReference,
            paymentNote: paymentRecord.paymentNote,
          },
          session,
        );

        await session.commitTransaction();

        await this.sendRepaymentNotifications(
          paymentRecord.creditAccount.toString(),
          paymentRecord.amountKobo,
          paymentRecord.paymentMethod,
          transactionReference,
        );

        return paymentCompleted;
      } catch (error) {
        await session.abortTransaction();

        const completed =
          await this.getCompletedCardPaymentResult(transactionReference);
        if (completed) {
          return completed;
        }

        if (this.isMongoWriteConflict(error) && attempt < maxAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 150 * (attempt + 1)),
          );
          continue;
        }

        throw error;
      } finally {
        session.endSession();
      }
    }

    const completed =
      await this.getCompletedCardPaymentResult(transactionReference);
    if (completed) {
      return completed;
    }

    throw new BadRequestException(
      'Unable to record card repayment. Please refresh your credit page.',
    );
  }

  /**
   * Admin approves bank transfer payment
   */
  async approveBankTransferPayment(
    id: string,
    approvalData: PaymentAdminApprovalDto,
    adminId: string,
  ) {
    const { amount, approvalNote = 'Payment approved' } = approvalData;
    const approvedBy = new Types.ObjectId(adminId);
    const amountInMoney = createMoney(amount, 'naira');
    const amountInKobo = amountInMoney.kobo;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find pending payment
      const pendingPayment = await this.paymentReferenceModel
        .findOne({
          _id: id,
          status: PaymentRefStatus.PENDING_APPROVAL,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
        })
        .session(session);

      if (!pendingPayment) {
        throw new NotFoundException(
          'Pending bank transfer payment not found or already processed',
        );
      }

      const isAmountMismatch = pendingPayment.amountKobo !== amountInKobo;
      const addExtraNote = isAmountMismatch
        ? ` (Amount mismatch: ${createMoney(pendingPayment.amountKobo, 'kobo').format()} expected, ${createMoney(amountInKobo, 'kobo').format()} received)`
        : '';

      const finalNote = approvalNote + addExtraNote;
      // Update payment status
      pendingPayment.status = PaymentRefStatus.COMPLETED;
      pendingPayment.approvedBy = approvedBy;
      pendingPayment.approvedAt = new Date();
      pendingPayment.amountKobo = amountInKobo;
      pendingPayment.actualAmountKobo = amountInKobo;
      pendingPayment.metadata.approvalNote = finalNote;
      pendingPayment.paymentNote = finalNote;
      pendingPayment.markModified('metadata');

      await pendingPayment.save({ session });

      // Process payment allocation
      const paymentResult = await this.processPaymentCore(
        {
          creditAccountId: pendingPayment.creditAccount.toString(),
          paymentAmount: amountInKobo,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: pendingPayment.referenceCode,
          paymentNote: finalNote,
        },
        session,
      );

      // Notify customer of approval
      await this.sendRepaymentNotifications(
        pendingPayment.creditAccount.toString(),
        amountInKobo,
        PaymentMethod.BANK_TRANSFER,
        pendingPayment.referenceCode,
      );

      await session.commitTransaction();

      return successResponse(
        'Bank transfer payment approved successfully',
        paymentResult,
      );
    } catch (error: any) {
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      session.endSession();
    }
  }

  // Admin rejects bank transfer payment
  async rejectBankTransferPayment(id: string, adminId: string) {
    const approvedBy = new Types.ObjectId(adminId);

    const pendingPayment = await this.paymentReferenceModel.findOne({
      _id: id,
      status: PaymentRefStatus.PENDING_APPROVAL,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
    });

    if (!pendingPayment) {
      throw new NotFoundException(
        'Pending bank transfer payment not found or already processed',
      );
    }

    pendingPayment.status = PaymentRefStatus.CANCELLED;
    pendingPayment.approvedBy = approvedBy;
    pendingPayment.approvedAt = new Date();
    pendingPayment.metadata.approvalNote = 'Payment rejected';
    pendingPayment.paymentNote = 'Payment rejected';
    pendingPayment.markModified('metadata');

    await pendingPayment.save();

    return successResponse(
      'Bank transfer payment rejected successfully',
      pendingPayment,
    );
  }

  // Process payment for multiple repayments and update credit account
  private async findPendingRepaymentSchedules(
    creditAccount: CreditAccountDocument,
    session?: ClientSession,
  ) {
    const pendingFilter = {
      status: {
        $ne: RepaymentStatus.PAID,
      },
    };

    const byAccount = await this.repaymentScheduleModel
      .find({
        creditAccount: creditAccount._id,
        ...pendingFilter,
      })
      .sort({ dueDate: 1, installmentNumber: 1 })
      .session(session);

    if (byAccount.length > 0 || !creditAccount.business) {
      return byAccount;
    }

    return this.repaymentScheduleModel
      .find({
        business: creditAccount.business,
        ...pendingFilter,
      })
      .sort({ dueDate: 1, installmentNumber: 1 })
      .session(session);
  }

  async processPaymentCore(
    paymentData: {
      creditAccountId: string;
      paymentAmount: number; // in kobo
      paymentMethod: PaymentMethod;
      transactionReference: string;
      paymentNote?: string;
    },
    session?: ClientSession,
  ): Promise<IPaymentResult> {
    const {
      creditAccountId,
      paymentAmount: amountInKobo,
      paymentMethod,
      transactionReference,
      paymentNote,
    } = paymentData;

    const dbSession =
      session || (await this.creditAccountModel.db.startSession());

    if (!session) {
      dbSession.startTransaction();
    }

    try {
      // 1. Get credit account and pending repayments
      const creditAccount = await this.creditAccountModel
        .findById(creditAccountId)
        .session(session);
      if (!creditAccount) {
        throw new NotFoundException('Credit account not found');
      }

      const [pendingRepayments, ongoingCreditRequests] = await Promise.all([
        this.findPendingRepaymentSchedules(creditAccount, session),
        this.creditRequestModel
          .find({
            creditAccount: creditAccountId,
            status: {
              $in: [CreditStatus.APPROVED, CreditStatus.DEFAULTED],
            },
          })
          .session(session),
      ]);

      if (pendingRepayments.length === 0) {
        if (transactionReference) {
          const completedPayment = await this.paymentReferenceModel
            .findOne({
              referenceCode: transactionReference,
              status: PaymentRefStatus.COMPLETED,
            })
            .session(session ?? null);

          if (completedPayment) {
            return {
              success: true,
              totalPaid: completedPayment.amountKobo,
              transactionReference,
            };
          }
        }

        throw new BadRequestException('No pending repayments found');
      }

      let remainingAmount = amountInKobo;

      // 2. Allocate payment to repayments in chronological order
      for (const repayment of pendingRepayments) {
        if (remainingAmount <= 0) {
          // update overdue repayment status
          await this.updateOverdueStatus(repayment, session);
          continue;
        }

        const allocationResult = await this.updateRepaymentSchedule(
          session,
          repayment,
          remainingAmount,
          paymentMethod,
          transactionReference,
          paymentNote,
        );

        remainingAmount = allocationResult.remainingAmount;
      }

      // 3. Update credit request completion status
      await Promise.all(
        ongoingCreditRequests.map((creditRequest) =>
          this.updateRequestCompletion(creditRequest, session),
        ),
      );

      // 4. Update credit account
      const totalPaid = amountInKobo - remainingAmount;
      await this.updateCreditAccountAfterPayment(
        creditAccount,
        totalPaid,
        session,
      );

      await this.accountingService.recordRepayment(amountInKobo, session);

      if (!session) {
        await dbSession.commitTransaction();
      }

      return {
        success: true,
        totalPaid,
        transactionReference,
      };
    } catch (error: any) {
      if (!session) {
        await dbSession.abortTransaction();
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        error?.message || 'Unable to allocate credit repayment',
      );
    } finally {
      if (!session) {
        dbSession.endSession();
      }
    }
  }

  private async updateRepaymentSchedule(
    session: ClientSession,
    repayment: RepaymentScheduleDocument,
    amount: number, // in kobo
    paymentMethod: PaymentMethod,
    transactionReference: string,
    paymentNote?: string,
  ) {
    let remainingAmount = amount;

    if (remainingAmount <= 0) return;

    // Update payment details for this repayment
    // ps: totalAmount = interestPayment + principalPayment;

    const previousPaidAmount = repayment.paidAmountKobo || 0;
    const amountDue = repayment.totalAmountKobo - previousPaidAmount; // amount left to pay in kobo
    const allocatedAmountPaid = Math.min(amountDue, amount); // amount to allocate now

    const newPaidAmount = previousPaidAmount + allocatedAmountPaid;
    const newRemainingAmount = Math.max(
      0,
      repayment.totalAmountKobo - newPaidAmount,
    );

    repayment.paidAmountKobo = newPaidAmount;
    repayment.remainingAmountKobo = newRemainingAmount;
    repayment.paidDate = new Date();
    repayment.paymentMethod = paymentMethod;
    repayment.transactionReference = transactionReference;
    repayment.paymentNote = paymentNote;

    // Update status based on payment
    if (newRemainingAmount === 0) {
      repayment.status = RepaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      repayment.status = RepaymentStatus.PARTIALLY_PAID;
    }

    remainingAmount -= allocatedAmountPaid;

    await repayment.save({ session });

    return { remainingAmount };
  }

  private async updateOverdueStatus(
    schedule: RepaymentScheduleDocument,
    session: ClientSession,
  ): Promise<void> {
    await this.applyOverdueStatus(schedule, session);
  }

  /**
   * Centralized logic to apply overdue status and charges
   */
  private async applyOverdueStatus(
    schedule: RepaymentScheduleDocument,
    session?: ClientSession,
  ): Promise<void> {
    const now = new Date();
    const gracePeriodEnd = schedule.gracePeriodEnd || schedule.dueDate;

    if (now > gracePeriodEnd && schedule.remainingAmountKobo > 0) {
      // Only apply charges if not already marked as overdue to avoid double charging
      const alreadyOverdue = schedule.status === RepaymentStatus.OVERDUE;

      const daysOverdue = Math.floor(
        (now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
      );

      schedule.isOverdue = true;
      schedule.daysOverdue = daysOverdue;
      schedule.status = RepaymentStatus.OVERDUE;

      if (!alreadyOverdue) {
        // Increment defaultedCounts on the credit account
        await this.creditAccountModel.updateOne(
          { _id: schedule.creditAccount },
          { $inc: { defaultedCounts: 1 } },
          { session },
        );

        // Calculate overdue charges if applicable
        const creditRequest = await this.creditRequestModel
          .findById(schedule.creditRequest)
          .session(session);

        if (creditRequest && creditRequest.overdueChargeRate > 0) {
          const overdueCharges = Math.round(
            (schedule.remainingAmountKobo * creditRequest.overdueChargeRate) /
              100,
          );
          schedule.overdueChargesKobo = overdueCharges;
          schedule.totalAmountKobo += overdueCharges;
          schedule.remainingAmountKobo += overdueCharges;
        }
      }

      await schedule.save({ session });
    }
  }

  private async updateCreditAccountAfterPayment(
    creditAccount: CreditAccountDocument,
    amount: number,
    session: ClientSession,
  ): Promise<void> {
    if (amount > 0) {
      creditAccount.totalPaymentsKobo += amount;
    }

    await this.syncCreditAccountBalances(creditAccount, session);
  }

  /**
   * Reconcile principal outstanding from repayment schedules.
   * Fixes cases where full installment payments (principal + interest) zeroed
   * outstanding too early.
   */
  async syncCreditAccountBalances(
    creditAccount: CreditAccountDocument | string,
    session?: ClientSession,
  ): Promise<CreditAccountDocument | null> {
    const account =
      typeof creditAccount === 'string'
        ? await this.creditAccountModel.findById(creditAccount).session(session ?? null)
        : creditAccount;

    if (!account) {
      return null;
    }

    const unpaidSchedules = await this.repaymentScheduleModel
      .find({
        creditAccount: account._id,
        status: { $ne: RepaymentStatus.PAID },
      })
      .session(session ?? null);

    account.outstandingKobo = sumPrincipalRemainingKobo(unpaidSchedules);
    account.availableKobo = Math.min(
      account.limitKobo,
      account.limitKobo - account.outstandingKobo,
    );
    account.creditUtilization =
      account.limitKobo > 0
        ? (account.outstandingKobo / account.limitKobo) * 100
        : 0;

    const overdueRepayments = await this.repaymentScheduleModel
      .find({
        creditAccount: account._id,
        status: RepaymentStatus.OVERDUE,
      })
      .session(session ?? null);

    account.totalOverdueKobo = overdueRepayments.reduce(
      (sum, rep) => sum + rep.remainingAmountKobo,
      0,
    );

    await account.save({ session: session ?? undefined });
    return account;
  }

  /**
   * Update credit request completion status
   */
  async updateRequestCompletion(
    creditRequest: CreditRequestDocument,
    session?: ClientSession,
  ): Promise<void> {
    const repaymentSchedules = await this.repaymentScheduleModel
      .find({
        creditRequest: creditRequest._id,
      })
      .session(session);

    const calculatedTotalPaid = repaymentSchedules.reduce(
      (sum, schedule) => sum + schedule.paidAmountKobo,
      0,
    );
    const paidInstallments = repaymentSchedules.filter(
      (schedule) => schedule.status === RepaymentStatus.PAID,
    ).length;

    const remainingBalance = Math.max(
      0,
      creditRequest.totalRepaymentAmountKobo - calculatedTotalPaid,
    );
    const isFullyPaid =
      remainingBalance === 0 && paidInstallments === repaymentSchedules.length;

    if (isFullyPaid) {
      creditRequest.status = CreditStatus.COMPLETED;
      creditRequest.completionPaymentDate = new Date();
    }

    await creditRequest.save({ session });
  }

  // Check and update overdue statuses. CRON Job
  async updateAllOverdueStatuses(): Promise<void> {
    const today = new Date();
    const pendingRepayments = await this.repaymentScheduleModel.find({
      status: {
        $in: [RepaymentStatus.PENDING, RepaymentStatus.PARTIALLY_PAID],
      },
      dueDate: { $lt: today },
    });

    await Promise.all(
      pendingRepayments.map((repayment) => this.applyOverdueStatus(repayment)),
    );
  }

  // Initiate paystack payment webhook
  async initiateCreditRepaymentWebhook(data: {
    paymentReference: string;
    creditAccountId: string;
    amount: number;
  }): Promise<void> {
    const { paymentReference, creditAccountId, amount } = data;

    const existingPayment = await this.paymentReferenceModel.findOne({
      referenceCode: paymentReference,
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentRefStatus.COMPLETED) {
        return;
      }
    }

    const creditAccount =
      await this.creditAccountModel.findById(creditAccountId);
    if (!creditAccount) {
      return;
    }

    let paymentRecord = existingPayment;
    if (!paymentRecord) {
      paymentRecord = await this.paymentReferenceModel.create({
        referenceCode: paymentReference,
        creditAccount: creditAccount._id,
        business: creditAccount.business,
        amountKobo: amount,
        paymentMethod: PaymentMethod.CARD,
        status: PaymentRefStatus.PENDING_APPROVAL,
      });

      await this.paystackPaymentReferenceModel.updateOne(
        { data: paymentReference },
        { data: paymentReference },
        { upsert: true },
      );
    }

    try {
      await this.internalProcessCardPayment(paymentRecord, paymentReference);
    } catch (error) {
      console.error(
        `Failed to process credit repayment webhook for ${paymentReference}:`,
        error,
      );
    }

    return;
  }

  /**
   * Send reminders for payments due in exactly 3 days
   */
  async sendUpcomingReminders() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    const nextDay = new Date(threeDaysFromNow);
    nextDay.setDate(nextDay.getDate() + 1);

    const upcomingRepayments = await this.repaymentScheduleModel
      .find({
        status: {
          $in: [RepaymentStatus.PENDING, RepaymentStatus.PARTIALLY_PAID],
        },
        dueDate: {
          $gte: threeDaysFromNow,
          $lt: nextDay,
        },
      })
      .populate('business');

    for (const repayment of upcomingRepayments) {
      await this.creditQueue.add(JOB_NAMES.SEND_CREDIT_NOTIFICATION, {
        type: 'upcoming',
        creditAccountId: repayment.creditAccount.toString(),
        repaymentId: repayment._id.toString(),
      });
    }
  }

  /**
   * Send notices for overdue payments
   */
  async sendOverdueNotices() {
    const overdueRepayments = await this.repaymentScheduleModel
      .find({
        status: RepaymentStatus.OVERDUE,
        remainingAmountKobo: { $gt: 0 },
      })
      .populate('business');

    for (const repayment of overdueRepayments) {
      await this.creditQueue.add(JOB_NAMES.SEND_CREDIT_NOTIFICATION, {
        type: 'overdue',
        creditAccountId: repayment.creditAccount.toString(),
        repaymentId: repayment._id.toString(),
      });
    }
  }

  /**
   * Send repayment notifications (Email & Push)
   */
  private async sendRepaymentNotifications(
    creditAccountId: string,
    amountInKobo: number,
    paymentMethod: PaymentMethod,
    transactionReference: string,
  ) {
    try {
      await this.creditQueue.add(JOB_NAMES.SEND_CREDIT_NOTIFICATION, {
        type: 'repayment',
        creditAccountId,
        amountInKobo,
        paymentMethod,
        transactionReference,
      });
    } catch (error) {
      console.error('Failed to queue repayment notification:', error);
    }
  }
}
