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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../jobs/constants';
import { AccountingService } from '../accounting/accounting.service';

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
        const paystackData =
          await this.paystackService.verifyTransaction(transactionReference);

        if (!paystackData) {
          throw new BadRequestException(
            'Payment verification failed. Please contact support if you have been debited.',
          );
        }

        // Check if this payment actually belongs to this credit account
        if (paystackData.metadata?.creditAccountId !== creditAccount.id) {
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
      throw new HttpException(
        error.response || 'An error occurred during payment processing',
        error.status || 500,
      );
    }
  }

  /**
   * Internal helper to process a verified card payment
   */
  private async internalProcessCardPayment(
    pendingPayment: any,
    transactionReference: string,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      pendingPayment.status = PaymentRefStatus.COMPLETED;
      await pendingPayment.save({ session });

      // Process the payment allocation
      const paymentCompleted = await this.processPaymentCore(
        {
          creditAccountId: pendingPayment.creditAccount.toString(),
          paymentAmount: pendingPayment.amountKobo,
          paymentMethod: pendingPayment.paymentMethod,
          transactionReference,
          paymentNote: pendingPayment.paymentNote,
        },
        session,
      );

      await session.commitTransaction();

      // Send notifications
      await this.sendRepaymentNotifications(
        pendingPayment.creditAccount.toString(),
        pendingPayment.amountKobo,
        pendingPayment.paymentMethod,
        transactionReference,
      );

      return paymentCompleted;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
        this.repaymentScheduleModel
          .find({
            creditAccount: creditAccountId,
            status: {
              $ne: RepaymentStatus.PAID,
            },
          })
          .sort({ dueDate: 1, installmentNumber: 1 })
          .session(session),
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
      throw new HttpException(error.response, error.status);
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
    creditAccount.outstandingKobo = Math.max(
      0,
      creditAccount.outstandingKobo - amount,
    );
    creditAccount.availableKobo = Math.min(
      creditAccount.limitKobo,
      creditAccount.limitKobo - creditAccount.outstandingKobo,
    );
    creditAccount.totalPaymentsKobo += amount;
    creditAccount.creditUtilization =
      creditAccount.limitKobo > 0
        ? (creditAccount.outstandingKobo / creditAccount.limitKobo) * 100
        : 0;

    // Recalculate overdue amount
    const overdueRepayments = await this.repaymentScheduleModel
      .find({
        creditAccount: creditAccount._id,
        status: RepaymentStatus.OVERDUE,
      })
      .session(session);

    creditAccount.totalOverdueKobo = overdueRepayments.reduce(
      (sum, rep) => sum + rep.remainingAmountKobo,
      0,
    );

    await creditAccount.save({ session });
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
