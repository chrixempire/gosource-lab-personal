import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Credit, CreditDocument } from './schema/credit.schema';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import {
  CreateApplicationDto,
  CreditLimitIncreaseDto,
  CreditRequestDto,
  RejectApplicationDto,
} from './dto/credit.dto';
import {
  CreditAccountStatusT,
  CreditApplicationTypeT,
  CreditRequestTypeT,
  CreditStatus,
  CreditTimelineStatusT,
} from './enum/credit.enum';
import { successResponse } from '../utils/responses';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import { paginationUtil } from '../utils/pagination';
import { CreditRequest } from './schema/creditRequest';
import { EmailService } from '../notification/email/email.service';
import { S3Service } from '../cloudinary/s3.service';
import {
  CreditAccount,
  CreditAccountDocument,
} from './schema/creditAccount.schema';
import { createMoney } from '../utils/money';
import { RepaymentSchedule } from './schema/repaymentSchedule.schema';
import { CreditPaymentReference } from './schema/creditPaymentReference.schema';
import { RepaymentFrequency, RepaymentStatus } from './enum/repayment.enum';
import { WalletTransaction } from '../wallet/schema/walletTransaction.schema';
import { TransactionType } from '../accounting/enum/accounting.enum';
import { TransactionStatus } from '../wallet/enum/wallet.enum';
import { daysSince } from '../utils/helpers';
import { BusinessCustomer } from '../business/schema/business.schema';
import {
  ACTIVE_STATUSES,
  REAPPLICATION_COOLDOWN_DAYS,
  ADMIN_EMAILS,
} from './helpers/constants';
import { CreditRepaymentService } from '../credit-repayment/credit-repayment.service';

@Injectable()
export class CreditService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<Credit>,
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    private s3Service: S3Service,
    @InjectModel(CreditAccount.name)
    private creditAccountModel: Model<CreditAccount>,
    @InjectModel(RepaymentSchedule.name)
    private creditRepaymentScheduleModel: Model<RepaymentSchedule>,
    @InjectModel(CreditPaymentReference.name)
    private creditPaymentReferenceModel: Model<CreditPaymentReference>,
    @InjectConnection() private connection: Connection,
    @InjectModel(WalletTransaction.name)
    private transactionModel: Model<WalletTransaction>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    private emailService: EmailService,
    private creditRepaymentService: CreditRepaymentService,
  ) {}

  /**
   * Creates a new credit application for a business.
   * @param creditDetails - The details of the credit application.
   * @param business - The business for which the application is being created.
   * @returns The created credit application.
   * @throws Error if the business already has a pending or approved credit application.
   */
  async createInitialApplication(
    creditDetails: CreateApplicationDto,
    business: any,
    files: any,
  ) {
    // check if last business application was rejected and it's less than ${REAPPLICATION_COOLDOWN_DAYS} days
    const lastRejectedApplication = await this.creditModel
      .findOne({
        business: business.id,
        status: CreditStatus.REJECTED,
      })
      .sort({ updatedAt: -1 });

    if (lastRejectedApplication) {
      if (
        daysSince((lastRejectedApplication as any).updatedAt) <
        REAPPLICATION_COOLDOWN_DAYS
      ) {
        throw new BadRequestException(
          `You can only re-apply once every ${REAPPLICATION_COOLDOWN_DAYS} days after application is rejected.`,
        );
      }
    }

    // Check if the business already has a credit application
    const existingApplication = await this.creditModel.findOne({
      business: business.id,
      status: ACTIVE_STATUSES,
    });

    if (existingApplication) {
      throw new ConflictException(
        'You already have a pending or approved credit application.',
      );
    }

    // Process file uploads
    const processedDetails = await this.processFileUploads(
      creditDetails,
      files,
    );

    const newCredit = {
      ...processedDetails,
      business: business.id,
      applicationType: CreditApplicationTypeT.INITIAL,
    };

    const createdCredit = await this.creditModel.create(newCredit);

    await createdCredit.populate('business');

    const businessCustomer = createdCredit.business;

    // SEND EMAIL NOTIFICATION TO ADMIN AND CONFIRMATION TO BUSINESS
    await this.sendApplicationNotifications(
      businessCustomer,
      CreditApplicationTypeT.INITIAL,
    );

    return successResponse(
      'Credit application created successfully',
      createdCredit,
    );
  }

  private async sendApplicationNotifications(
    business: any,
    applicationType: CreditApplicationTypeT,
  ) {
    if (process.env.NODE_ENV !== 'development') {
      await this.emailService.sendBulkMailtrapWithTemplate(ADMIN_EMAILS, {
        subject:
          applicationType === CreditApplicationTypeT.INITIAL
            ? 'New Credit Application Submitted'
            : 'Credit Limit Increase Application Submitted',
        template: 'credit-application-submitted-admin',
        variables: {
          BUSINESS_NAME: business.businessName,
          APPLICATION_TYPE:
            applicationType === CreditApplicationTypeT.INITIAL
              ? 'credit application'
              : 'credit limit increase',
        },
      });
    }

    await this.emailService.sendMail({
      to: business.email,
      subject:
        applicationType === CreditApplicationTypeT.INITIAL
          ? 'Credit Application Submitted'
          : 'Credit Limit Increase Application Submitted',
      template: 'credit-application-submitted',
      variables: {
        BUSINESS_NAME: business.businessName,
        APPLICATION_TYPE:
          applicationType === CreditApplicationTypeT.INITIAL
            ? 'credit application'
            : 'credit limit increase',
      },
    });
  }

  private async sendRequestNotifications(requestId: string) {
    const request = await this.creditRequestModel
      .findById(requestId)
      .populate('business')
      .lean();

    const business = request.business as any;
    const amount = createMoney(request.requestedAmountKobo, 'kobo').format();

    if (process.env.NODE_ENV !== 'development') {
      await this.emailService.sendBulkMailtrapWithTemplate(ADMIN_EMAILS, {
        subject: `${
          request.requestType === CreditRequestTypeT.INITIAL
            ? 'New Credit Request'
            : 'Credit Top-up Request'
        } Submitted`,
        template: 'credit-request-submitted-admin',
        variables: {
          BUSINESS_NAME: business.businessName,
          REQUEST_TYPE:
            request.requestType === CreditRequestTypeT.INITIAL
              ? 'credit request'
              : 'credit top-up request',
          REQUEST_AMOUNT: amount,
          SUBMITTED_ON: new Date(
            (request as any).createdAt,
          ).toLocaleDateString(),
        },
      });
    }

    await this.emailService.sendMail({
      to: business.email,
      subject: `${
        request.requestType === CreditRequestTypeT.INITIAL
          ? 'Credit Request'
          : 'Credit Top-up Request'
      } Submitted`,
      template: 'credit-request-submitted',
      variables: {
        BUSINESS_NAME: business.businessName,
        REQUEST_TYPE:
          request.requestType === CreditRequestTypeT.INITIAL
            ? 'credit request'
            : 'credit top-up request',
        REQUEST_AMOUNT: amount,
        REQUEST_DATE: new Date((request as any).createdAt).toLocaleDateString(),
      },
    });
  }

  private async validateCreditAccountEligibility(
    creditAccount: CreditAccountDocument,
  ) {
    if (creditAccount.creditUtilization > 50) {
      throw new BadRequestException(
        'Reduce your current credit usage before requesting a limit increase.',
      );
    }

    if (daysSince((creditAccount as any).createdAt) < 30) {
      throw new BadRequestException(
        'Your account must be at least 30 days old before requesting a limit increase.',
      );
    }

    // Must have repaid over 50k before requesting limit increase.
    const totalRepaid = createMoney(creditAccount.totalPaymentsKobo, 'kobo');
    if (totalRepaid.naira < 50000) {
      throw new BadRequestException(
        'You need a repayment history before requesting a limit increase.',
      );
    }

    if (creditAccount.totalOverdueKobo > 0) {
      throw new BadRequestException(
        'Cannot request credit increase while you have overdue payments.',
      );
    }
  }

  async requestCreditIncreaseApplication(
    creditDetails: CreditLimitIncreaseDto,
    business: any,
    file: any,
  ) {
    const businessId = new Types.ObjectId(`${business.id}`);

    // Check if business has a credit account and it is active
    const creditAccount = await this.getValidatedBusinessCreditAccount(
      business.id,
    );

    await this.validateCreditAccountEligibility(creditAccount);

    const [auditResults] = await this.creditModel.aggregate([
      { $match: { business: businessId } },
      {
        $facet: {
          initialApplication: [
            {
              $match: {
                applicationType: CreditApplicationTypeT.INITIAL,
                status: CreditStatus.APPROVED,
              },
            },
            { $limit: 1 },
          ],
          pendingIncrease: [
            {
              $match: {
                applicationType: CreditApplicationTypeT.INCREASE,
                status: CreditStatus.PENDING,
              },
            },
            { $limit: 1 },
          ],
        },
      },
      {
        $lookup: {
          from: 'credits',
          pipeline: [
            {
              $match: {
                business: businessId,
                status: CreditStatus.REJECTED,
              },
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 1 },
          ],
          as: 'lastRejectedApplication',
        },
      },
    ]);

    const lastRejectedApplication = auditResults.lastRejectedApplication[0];

    if (auditResults.initialApplication.length === 0) {
      throw new BadRequestException(
        'You need to have an approved credit application before requesting a limit increase.',
      );
    }

    if (lastRejectedApplication) {
      if (
        daysSince(lastRejectedApplication.updatedAt) <
        REAPPLICATION_COOLDOWN_DAYS
      ) {
        throw new BadRequestException(
          `You can only re-apply once every ${REAPPLICATION_COOLDOWN_DAYS} days after application is rejected.`,
        );
      }
    }

    if (auditResults.pendingIncrease.length > 0) {
      throw new ConflictException(
        'You already have a pending credit increase application.',
      );
    }

    const initialApp = auditResults.initialApplication[0];

    // Process file uploads
    const uploadedFile = await this.s3Service.uploadFile(file);

    const newCredit = {
      ...creditDetails,
      bankStatement: uploadedFile.url,
      bvn: initialApp.bvn,
      cacRegistrationNumber: initialApp.cacRegistrationNumber,
      business: business.id,
      applicationType: CreditApplicationTypeT.INCREASE,
      currentCreditAccount: creditAccount,
      tin: initialApp.tin,
      applicationLevel: (initialApp.applicationLevel || 0) + 1,
    };

    const createdCredit = await this.creditModel.create(newCredit);

    await createdCredit.populate('business');

    const businessCustomer = createdCredit.business;

    // SEND EMAIL NOTIFICATION TO ADMIN AND CONFIRMATION TO BUSINESS
    await this.sendApplicationNotifications(
      businessCustomer,
      CreditApplicationTypeT.INCREASE,
    );

    return successResponse(
      'Credit increase application submitted successfully',
      createdCredit,
    );
  }

  private async processFileUploads(applicationData: any, files: any) {
    if (files && files.bankStatement) {
      const data = await this.s3Service.uploadFile(files.bankStatement[0]);

      if (data) {
        applicationData['bankStatement'] = data.url;
      }
    }

    if (files && files.identity) {
      const data = await this.s3Service.uploadFile(files.identity[0]);

      if (data) {
        applicationData['identity'] = data.url;
      }
    }

    return applicationData;
  }

  /**
   * Rejects a credit application for a business.
   * @param rejectionDetails - The details of the rejection.
   * @param business - The business for which the application is being rejected.
   * @param creditId - The ID of the credit application to be rejected.
   * @returns The updated credit application.
   * @throws Error if the credit application is not found or if it has already been rejected.
   */
  async rejectApplication(
    rejectionDetails: RejectApplicationDto,
    business: any,
    creditId: string,
  ) {
    const { rejectionReason } = rejectionDetails;

    // Find the credit application by ID and business
    const creditApplication = await this.creditModel.findOne({
      _id: creditId,
      business: business.id,
    });

    if (!creditApplication) {
      throw new ConflictException('Credit application not found');
    }

    // Update the status and rejection reason
    creditApplication.status = CreditStatus.REJECTED;
    creditApplication.rejectionReason = rejectionReason;

    await creditApplication.save();

    // TODO: Send email to business with rejection reason

    return successResponse(
      'Credit application rejected successfully',
      creditApplication,
    );
  }

  /**
   * Retrieves all credit applications for a business with pagination.
   * @param queryParams - The query parameters for pagination.
   * @param business - The business for which the applications are being retrieved.
   * @returns A paginated list of credit applications.
   */
  async getCredits(queryParams: QueryParamsDto, business: any) {
    const { limit = 200, page = 1 } = queryParams;

    // Initialize filter object for database query
    const filter: any = {};

    filter.business = business.id;

    const result = await paginationUtil.paginate({
      model: this.creditModel,
      page,
      limit,
      filter,
    });

    const credits = result.data;
    const meta = result.meta;

    return successResponse('Credits retrieved successfully', {
      credits,
      meta,
    });
  }

  /**
   * Retrieves a single credit application by ID for a business.
   * @param creditId - The ID of the credit application to be retrieved.
   * @param business - The business for which the application is being retrieved.
   * @returns The credit application if found, otherwise an error.
   */
  async getSingleCredit(creditId: string, business: any) {
    const creditApplication: CreditDocument = await this.creditModel.findOne({
      _id: creditId,
      business: business.id,
    });

    if (!creditApplication) {
      throw new ConflictException('Credit application not found');
    }

    return successResponse(
      'Credit application retrieved successfully',
      creditApplication,
    );
  }

  private async hasActiveRequest(
    businessId: string,
    requestType?: CreditRequestTypeT,
  ): Promise<boolean> {
    const query: any = {
      business: businessId,
      status: ACTIVE_STATUSES,
    };

    if (requestType) {
      query.requestType = requestType;
    }

    const existingRequest = await this.creditRequestModel.findOne(query);
    return !!existingRequest;
  }

  async sendCreditRequest(creditDetails: CreditRequestDto, business: any) {
    const account = await this.getValidatedBusinessCreditAccount(business.id);

    // Check if the business currently has a credit requested
    // Block new-request if business has ongoing or pending request but allow top-up within the credit available
    if (creditDetails.requestType === CreditRequestTypeT.INITIAL) {
      const existingApplication = await this.hasActiveRequest(
        business.id,
        CreditRequestTypeT.INITIAL,
      );

      if (existingApplication) {
        throw new ConflictException(
          'You already have a pending or ongoing credit request.',
        );
      }
    }

    if (creditDetails.requestType === CreditRequestTypeT.TOPUP) {
      const activeInitial = await this.hasActiveRequest(
        business.id,
        CreditRequestTypeT.INITIAL,
      );

      if (!activeInitial) {
        throw new BadRequestException(
          'You do not have an active credit to top up.',
        );
      }

      const existingTopUp = await this.hasActiveRequest(
        business.id,
        CreditRequestTypeT.TOPUP,
      );

      if (existingTopUp) {
        throw new ConflictException(
          'You already have a pending top-up request.',
        );
      }
    }

    if (account.creditUtilization > 60) {
      throw new BadRequestException(
        'Your credit utilization is above 60%. Please make a repayment before requesting for more credit.',
      );
    }

    const processedCreditDetails = this.validateCreditRequest(
      creditDetails,
      account,
    );

    const newCredit = {
      ...processedCreditDetails,
      business: business.id,
      creditAccount: account._id,
      currentCreditAccount: account,
    };

    const createdCredit = await this.creditRequestModel.create(newCredit);

    // SEND EMAIL NOTIFICATION TO ADMIN AND CONFIRMATION TO BUSINESS
    await this.sendRequestNotifications(createdCredit._id.toString());

    return successResponse('Credit request sent successfully', createdCredit);
  }

  private async getValidatedBusinessCreditAccount(
    businessId: string,
    session?: ClientSession,
  ) {
    const account = await this.creditAccountModel
      .findOne({
        business: new Types.ObjectId(businessId),
      })
      .session(session);

    if (!account) {
      throw new NotFoundException('Credit account not found for this business');
    }

    if (account.status !== CreditAccountStatusT.ACTIVE) {
      throw new BadRequestException('Credit account is not active');
    }

    return account;
  }

  private validateCreditRequest(
    creditDetails: CreditRequestDto,
    account: CreditAccountDocument,
  ) {
    const { requestedAmount, requestType } = creditDetails;
    const requestedAmountKobo = createMoney(requestedAmount, 'naira').kobo;

    if (requestType === CreditRequestTypeT.INITIAL) {
      if (requestedAmountKobo > account.limitKobo) {
        throw new BadRequestException(
          'Requested amount exceeds available credit',
        );
      }
      if (account.outstandingKobo > 0) {
        throw new BadRequestException(
          'You still have an outstanding balance on your credit account',
        );
      }
    }

    if (requestType === CreditRequestTypeT.TOPUP) {
      if (requestedAmountKobo > account.availableKobo) {
        throw new BadRequestException(
          'Requested amount exceeds available credit',
        );
      }
    }

    if (
      creditDetails.requestedRepaymentFrequency === RepaymentFrequency.WEEKLY
    ) {
      if (creditDetails.requestedRepaymentDuration > 3) {
        throw new BadRequestException(
          'Exceeded allowed duration for weekly repayment frequency',
        );
      }
    }

    delete creditDetails.requestedAmount;

    return { ...creditDetails, requestedAmountKobo };
  }

  async getBusinessCreditAccount(business: any) {
    const businessId = new Types.ObjectId(`${business.id}`);
    const account = await this.creditAccountModel.findOne({
      business: businessId,
    });

    if (account) {
      try {
        await this.creditRepaymentService.syncCreditAccountBalances(account);
      } catch {
        // Best-effort reconcile on read; avoid surfacing transient write conflicts.
      }
    }

    return successResponse('Credit account fetched successfully', account);
  }

  /**
   * Get credit requests.
   *
   * @param business
   * @returns
   */
  async getRequests(business: any, queryParams: QueryParamsDto): Promise<any> {
    const { limit = 10, page = 1 } = queryParams;

    // Initialize filter object for database query
    const filter: any = {};

    filter.business = business.id;

    const result = await paginationUtil.paginate({
      model: this.creditRequestModel,
      page,
      limit,
      filter,
      sort: { createdAt: -1 },
    });

    const requests = result.data;
    const meta = result.meta;

    return successResponse('Requests fetched successfully', { requests, meta });
  }

  /**
   * Cancelled request.
   *
   * @param requestId
   * @param business
   * @returns {object}
   */
  async cancelRequest(requestId: string, business: any): Promise<any> {
    const request = await this.creditRequestModel.findByIdAndUpdate(
      { _id: requestId, business: business.id },
      {
        status: CreditStatus.CANCELLED,
      },
      {
        new: true,
      },
    );

    if (!request) {
      throw new NotFoundException('Credit request not found');
    }

    return successResponse('Credit request cancelled successfully', request);
  }

  async getRepaymentHistory(business: any, queryParams: QueryParamsDto) {
    const { limit = 10, page = 1 } = queryParams;

    // Initialize filter object for database query
    const filter: any = {};

    filter.business = new Types.ObjectId(`${business.id}`);

    const result = await paginationUtil.paginate({
      model: this.creditPaymentReferenceModel,
      page,
      limit,
      filter,
      populate: ['creditAccount', 'business'],
      sort: { createdAt: -1 },
    });

    const repayments = result.data;
    const meta = result.meta;

    return successResponse('Repayment history fetched successfully', {
      repayments,
      meta,
    });
  }

  async getSingleRequestWithRepayments(requestId: string, businessId: string) {
    const result = await this.creditRequestModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(requestId),
          business: new Types.ObjectId(businessId),
        },
      },
      {
        $lookup: {
          from: 'repaymentschedules',
          localField: '_id',
          foreignField: 'creditRequest',
          as: 'schedules',
        },
      },
    ]);

    if (!result.length) {
      throw new NotFoundException('Credit request not found');
    }

    return successResponse(
      'Credit request with repayments fetched successfully',
      result[0],
    );
  }

  async getUpcomingPayment(business: any) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const unpaidSchedules = await this.creditRepaymentScheduleModel
      .find({
        business: business.id,
        status: {
          $in: [
            RepaymentStatus.PENDING,
            RepaymentStatus.PARTIALLY_PAID,
            RepaymentStatus.OVERDUE,
          ],
        },
      })
      .sort({ dueDate: 1 });

    if (unpaidSchedules.length === 0) {
      return successResponse('No unpaid repayment schedules found', null);
    }

    const nextUpcoming = unpaidSchedules.find((s) => s.dueDate >= now);
    const overdueRepayments = unpaidSchedules.filter((s) => s.dueDate < now);

    const totalOverdueKobo = overdueRepayments.reduce(
      (sum, s) => sum + s.remainingAmountKobo,
      0,
    );

    const totalNextPaymentKobo =
      (nextUpcoming?.remainingAmountKobo ?? 0) + totalOverdueKobo;

    return successResponse('Upcoming payment details fetched successfully', {
      nextUpcoming: nextUpcoming || null,
      overdueSummary: {
        totalOverdueKobo,
        count: overdueRepayments.length,
        overduePayments: overdueRepayments,
      },
      totalNextPaymentKobo,
    });
  }

  async purchaseFromCredit(
    business: any,
    amount: number,
    reference: string,
    clientSession?: ClientSession,
  ) {
    const session = clientSession || (await this.connection.startSession());
    if (!clientSession) {
      session.startTransaction();
    }

    try {
      const account = await this.getValidatedBusinessCreditAccount(
        business.id,
        session,
      );

      const amountInMoney = createMoney(amount, 'naira');
      const amountKobo = amountInMoney.kobo;

      if (amountKobo > account.spendableAmountKobo) {
        throw new BadRequestException('Insufficient credit balance');
      }

      const note = `Business purchased with credit: ${amountInMoney.format()}`;

      account.spendableAmountKobo -= amountKobo;
      account.timeline.unshift({
        note,
        status: CreditTimelineStatusT.PURCHASE,
        changedAt: new Date(),
      });
      await account.save({ session });

      const transactionData = {
        reference,
        amount,
        description: note,
        type: TransactionType.DEBIT,
        business: business.id,
        paymentReference: reference,
        status: TransactionStatus.SUCCESSFUL,
      };

      const newTransaction = new this.transactionModel(transactionData);
      await newTransaction.save({ session });

      return successResponse('Purchased successfully', account);
    } catch (error: any) {
      if (!clientSession) {
        await session.abortTransaction();
      }
      if (error.status) {
        throw new HttpException(error.response, error.status);
      } else {
        throw new InternalServerErrorException(error.response);
      }
    } finally {
      if (!clientSession) {
        session.endSession();
      }
    }
  }
}
