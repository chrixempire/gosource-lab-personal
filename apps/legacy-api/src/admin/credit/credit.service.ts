import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Credit, CreditDocument } from '../../credit/schema/credit.schema';
import {
  ApproveApplicationDto,
  ApproveCreditRequestDto,
  RejectApplicationDto,
  UpdateApplicationStatusDto,
} from '../../credit/dto/credit.dto';
import {
  CreditAccountStatusT,
  CreditApplicationTypeT,
  CreditRequestTypeT,
  CreditStatus,
  CreditTimelineStatusT,
} from '../../credit/enum/credit.enum';
import { successResponse } from '../../utils/responses';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { paginationUtil } from '../../utils/pagination';

import {
  CreditRequest,
  CreditRequestDocument,
} from '../../credit/schema/creditRequest';
import {
  RepaymentSchedule,
  RepaymentScheduleDocument,
} from '../../credit/schema/repaymentSchedule.schema';
import {
  RepaymentFrequency,
  RepaymentStatus,
} from '../../credit/enum/repayment.enum';
import { CreditAccount } from '../../credit/schema/creditAccount.schema';
import { createMoney } from '../../utils/money';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '../../jobs/constants';
import { AccountingService } from '../../accounting/accounting.service';
import { ActivityService } from '../../activity/activity.service';
import { adminInitiator } from '../../utils/activity-initiator.util';
import { ACTIVITY_LOG_ACTION_TYPE } from '../../activity/interface/activityLog.interface';

@Injectable()
export class CreditService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<Credit>,
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    @InjectModel(RepaymentSchedule.name)
    private repaymentScheduleModel: Model<RepaymentSchedule>,
    @InjectModel(CreditAccount.name)
    private creditAccountModel: Model<CreditAccount>,
    @InjectConnection() private readonly connection: Connection,
    @InjectQueue(QUEUE_NAMES.CREDIT_REPAYMENT) private creditQueue: Queue,
    private accountingService: AccountingService,
    private activityService: ActivityService,
  ) {}

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
    creditId: string,
    admin: any,
  ): Promise<any> {
    const { rejectionReason } = rejectionDetails;

    // Find the credit application by ID and business
    const creditApplication = await this.creditModel
      .findOne({
        _id: creditId,
      })
      .populate('business');

    if (!creditApplication) {
      throw new ConflictException('Credit application not found');
    }

    if (creditApplication.status !== CreditStatus.PENDING) {
      throw new ConflictException(
        'Sorry, this credit application has already been processed',
      );
    }

    // Update the status and rejection reason
    creditApplication.status = CreditStatus.REJECTED;
    creditApplication.rejectionReason = rejectionReason;

    creditApplication.timeline.unshift({
      status: CreditTimelineStatusT.REJECTED,
      changedBy: admin.id,
      changedAt: new Date(),
      note: rejectionReason,
    });

    await creditApplication.save();

    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: 'Credit',
      objectId: creditId,
      description: `Rejected credit application for ${(creditApplication.business as any)?.businessName ?? ''}`.trim(),
      metadata: {
        changes: { status: { old: CreditStatus.PENDING, new: CreditStatus.REJECTED } },
        reason: rejectionReason ?? null,
      },
    });

    // Send email to business with rejection reason
    await this.sendCreditNotification(
      creditApplication.business._id,
      {
        subject:
          creditApplication.applicationType === CreditApplicationTypeT.INITIAL
            ? 'Credit application rejected'
            : 'Credit limit increase application rejected',
        template: 'credit-application-declined',
        variables: {
          BUSINESS_NAME: creditApplication.business.businessName,
          APPLICATION_TYPE:
            creditApplication.applicationType === CreditApplicationTypeT.INITIAL
              ? 'new credit'
              : 'credit limit increase',
          REASON: rejectionReason,
        },
      },
      {
        title: 'Credit Application Rejected',
        body: `Your credit application has been rejected. Please check your email for more information.`,
      },
    );

    return successResponse(
      'Credit application rejected successfully',
      creditApplication,
    );
  }

  /**
   * Updates the status of a rejected credit application to pending.
   * @param creditId - The ID of the credit application to update.
   * @param admin - The admin user performing the update.
   * @returns The updated credit application.
   * @throws ConflictException if the credit application is not found or not rejected.
   */
  async updateCreditStatusToPending(
    creditId: string,
    data: UpdateApplicationStatusDto,
    admin: any,
  ): Promise<any> {
    const credit = await this.creditModel.findOne({
      _id: creditId,
      status: CreditStatus.REJECTED,
    });

    if (!credit) {
      throw new ConflictException('Credit not found or not rejected');
    }

    credit.status = CreditStatus.PENDING;
    credit.timeline.unshift({
      status: CreditTimelineStatusT.PENDING,
      changedBy: admin.id,
      changedAt: new Date(),
      note: `Status updated to pending. Reason: ${data.reason}`,
    });

    await credit.save();

    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: 'Credit',
      objectId: creditId,
      description: 'Reopened credit application to pending',
      metadata: {
        changes: {
          status: { old: CreditStatus.REJECTED, new: CreditStatus.PENDING },
        },
        reason: data.reason ?? null,
      },
    });

    return successResponse(
      'Credit application status updated to pending successfully',
      credit,
    );
  }

  /**
   * Retrieves all credit applications for a business with pagination.
   * @param queryParams - The query parameters for pagination.
   * @param business - The business for which the applications are being retrieved.
   * @returns A paginated list of credit applications.
   */
  async getCredits(queryParams: QueryParamsDto): Promise<any> {
    const { limit = 200, page = 1 } = queryParams;

    // Initialize filter object for database query
    const filter: any = {};

    const result = await paginationUtil.paginate({
      model: this.creditModel,
      page,
      limit,
      filter,
      populate: ['business', 'timeline.changedBy'],
    });

    const credits = result.data;
    const meta = result.meta;

    return successResponse('Credits retrieved successfully', {
      credits,
      meta,
    });
  }

  /**
   * Retrieves all credit requests for a business with pagination.
   * @param queryParams - The query parameters for pagination.
   * @param business - The business for which the applications are being retrieved.
   * @returns A paginated list of credit applications.
   */
  async getCreditRequests(queryParams: QueryParamsDto): Promise<any> {
    const { limit = 10, page = 1 } = queryParams;

    // Initialize filter object for database query
    const filter: any = {};

    const result = await paginationUtil.paginate({
      model: this.creditRequestModel,
      page,
      limit,
      filter,
      populate: ['business', 'timeline.changedBy', 'creditAccount'],
    });

    const requests = result.data;
    const meta = result.meta;

    return successResponse('Credits requests retrieved successfully', {
      requests,
      meta,
    });
  }

  async getCreditRequest(requestId: string): Promise<any> {
    const request: any = await this.creditRequestModel
      .findById(requestId)
      .populate(['business', 'timeline.changedBy', 'creditAccount']);

    if (!request) {
      throw new BadRequestException('Credit request not found');
    }

    const businessId = request.business?._id ?? request.business;
    request.application =
      await this.findInitialCreditApplicationForBusiness(businessId);

    return successResponse('Credit request retrieved successfully', request);
  }

  private async findInitialCreditApplicationForBusiness(
    businessId: Types.ObjectId | string,
  ): Promise<CreditDocument | null> {
    const businessObjectId = new Types.ObjectId(String(businessId));

    const approvedApplication = await this.creditModel
      .findOne({
        business: businessObjectId,
        applicationType: CreditApplicationTypeT.INITIAL,
        status: CreditStatus.APPROVED,
      })
      .sort({ createdAt: -1 });

    if (approvedApplication) {
      return approvedApplication;
    }

    return this.creditModel
      .findOne({
        business: businessObjectId,
        applicationType: CreditApplicationTypeT.INITIAL,
      })
      .sort({ createdAt: -1 });
  }

  async getCreditRequestStats(): Promise<any> {
    const [
      totalRequests,
      totalPendingRequests,
      totalApprovedRequests,
      totalRejectedRequests,
      creditInUseResult,
      totalOverdueAccounts,
    ] = await Promise.all([
      this.creditRequestModel.countDocuments({}),
      this.creditRequestModel.countDocuments({
        status: CreditStatus.PENDING,
      }),

      this.creditRequestModel.countDocuments({
        status: CreditStatus.APPROVED,
      }),
      this.creditRequestModel.countDocuments({
        status: CreditStatus.REJECTED,
      }),
      this.creditAccountModel.aggregate([
        { $match: { status: CreditAccountStatusT.ACTIVE } },
        {
          $group: { _id: null, totalOutstanding: { $sum: '$outstandingKobo' } },
        },
      ]),
      this.creditAccountModel.countDocuments({
        status: CreditAccountStatusT.ACTIVE,
        totalOverdueKobo: { $gt: 0 },
      }),
    ]);

    const totalCreditInUse = creditInUseResult[0]?.totalOutstanding ?? 0;

    return successResponse('Credit request stats retrieved successfully', {
      totalRequests,
      totalPendingRequests,
      totalApprovedRequests,
      totalRejectedRequests,
      totalCreditInUse,
      totalOverdueAccounts,
    });
  }

  /**
   * Cancelled request.
   *
   * @param requestId
   * @param business
   * @returns {object}
   */
  async rejectRequest(
    requestId: string,
    details: RejectApplicationDto,
    admin: any,
  ): Promise<any> {
    const { rejectionReason } = details;
    const request = await this.creditRequestModel
      .findByIdAndUpdate(
        { _id: requestId, status: CreditStatus.PENDING },
        {
          status: CreditStatus.REJECTED,
          rejectionReason,
          timeline: [
            {
              status: CreditTimelineStatusT.REJECTED,
              changedBy: admin.id,
              changedAt: new Date(),
              note: rejectionReason,
            },
          ],
        },
        {
          new: true,
        },
      )
      .populate('business');

    if (!request) {
      throw new BadRequestException(
        'Credit request not found or could not be rejected',
      );
    }

    await this.creditAccountModel.updateOne(
      { _id: request.business._id },
      { $inc: { creditRequestRejectCounts: 1 } },
    );

    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: 'Credit',
      objectId: requestId,
      description: `Rejected credit request for ${(request.business as any)?.businessName ?? ''}`.trim(),
      metadata: {
        changes: {
          status: { old: CreditStatus.PENDING, new: CreditStatus.REJECTED },
        },
        reason: rejectionReason ?? null,
      },
    });

    await this.sendCreditNotification(
      request.business._id,
      {
        subject: 'Credit Request Declined',
        template: 'credit-request-declined',
        variables: {
          BUSINESS_NAME: request.business.businessName,
          REASON: rejectionReason,
        },
      },
      {
        title: 'Credit Request Declined',
        body: `Your credit request has been declined. Please check your email for more information.`,
      },
    );

    return successResponse('Credit request rejected successfully', request);
  }

  /**
   * Retrieves a single credit application by ID for a business.
   * @param creditId - The ID of the credit application to be retrieved.
   * @param business - The business for which the application is being retrieved.
   * @returns The credit application if found, otherwise an error.
   */
  async getSingleCredit(creditId: string): Promise<any> {
    const creditApplication: CreditDocument = await this.creditModel
      .findOne({
        _id: creditId,
      })
      .populate(['business', 'timeline.changedBy']);

    if (!creditApplication) {
      throw new ConflictException('Credit application not found');
    }

    return successResponse(
      'Credit application retrieved successfully',
      creditApplication,
    );
  }

  /**
   * Retrieves all credit applications for a business with pagination.
   * @param queryParams - The query parameters for pagination.
   * @param business - The business for which the applications are being retrieved.
   * @returns A paginated list of credit applications.
   */
  async getBusinessCredits(
    queryParams: QueryParamsDto,
    businessId: any,
  ): Promise<any> {
    const { limit = 200, page = 1 } = queryParams;

    // Initialize filter object for database query
    const filter: any = {};

    filter.business = businessId;

    const result = await paginationUtil.paginate({
      model: this.creditModel,
      page,
      limit,
      filter,
      populate: ['business'],
    });

    const credits = result.data;
    const meta = result.meta;

    return successResponse('Credits retrieved successfully', {
      credits,
      meta,
    });
  }

  /**
   * Approves a credit application for a business.
   * @param approvalDetails - The details of the approval.
   * @param creditId - The ID of the credit application to be approved.
   * @returns The updated credit application.
   * @throws Error if the credit application is not found or if it has already been approved.
   */
  async approveCredit(
    approvalDetails: ApproveApplicationDto,
    creditId: string,
    admin: any,
  ): Promise<any> {
    const { approvedAmount } = approvalDetails;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find the credit application by ID
      const creditApplication = await this.creditModel
        .findOne({
          _id: creditId,
        })
        .populate('business')
        .session(session);

      if (!creditApplication) {
        throw new ConflictException('Credit application not found');
      }

      // Check if the application is not pending
      if (creditApplication.status !== CreditStatus.PENDING) {
        throw new ConflictException('Credit application is not pending');
      }

      // Convert the approved amount from naira to kobo
      const approvedAmountInMoney = createMoney(approvedAmount, 'naira');

      // Update the status and approved amount
      creditApplication.status = CreditStatus.APPROVED;
      creditApplication.approvedAmountKobo = approvedAmountInMoney.kobo;

      creditApplication.timeline.unshift({
        status: CreditTimelineStatusT.APPROVED,
        changedBy: admin.id,
        changedAt: new Date(),
        note: `Approved for amount ${approvedAmountInMoney.format()}`,
      });

      await creditApplication.save({ session });

      // For initial, create account; for increase, update account
      const creditAccount = await this.createCreditAccount({
        businessId: creditApplication.business._id,
        approvedAmount: approvedAmountInMoney.kobo,
        adminId: admin.id,
        session,
      });

      await session.commitTransaction();

      await this.activityService.record({
        ...adminInitiator(admin),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Credit',
        objectId: creditId,
        description: `Approved credit for ${(creditApplication.business as any)?.businessName ?? ''} — ${approvedAmountInMoney.format()}`.trim(),
        metadata: {
          changes: { status: { old: CreditStatus.PENDING, new: CreditStatus.APPROVED } },
          approvedAmount: approvedAmountInMoney.format(),
        },
      });

      // Send email to business with approval details (AFTER COMMIT)
      await this.sendCreditNotification(
        creditApplication.business._id,
        {
          subject:
            creditApplication.applicationType === CreditApplicationTypeT.INITIAL
              ? 'Credit Application Approved - GoSource'
              : 'Credit Limit Increase Approved - GoSource',
          template:
            creditApplication.applicationType === CreditApplicationTypeT.INITIAL
              ? 'credit-application-approved'
              : 'credit-limit-increase-approved',
          variables:
            creditApplication.applicationType === CreditApplicationTypeT.INITIAL
              ? {
                  BUSINESS_NAME: creditApplication.business.businessName,
                  LIMIT_AMOUNT: approvedAmountInMoney.format(),
                }
              : {
                  BUSINESS_NAME: creditApplication.business.businessName,
                  NEW_LIMIT: approvedAmountInMoney.format(),
                },
        },
        {
          title: 'Credit Application Approved',
          body: `Your credit application has been approved. Please check your email for more information.`,
        },
      );

      return successResponse('Credit application approved successfully', {
        creditApplication,
        creditAccount,
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async createCreditAccount({
    businessId,
    approvedAmount,
    adminId,
    session,
  }: {
    businessId: Types.ObjectId;
    approvedAmount: number; // in kobo
    adminId: Types.ObjectId;
    session?: ClientSession;
  }) {
    const approvedAmountInMoney = createMoney(approvedAmount, 'kobo');
    let account = await this.creditAccountModel
      .findOne({ business: businessId })
      .session(session);
    if (!account) {
      // create
      account = await this.creditAccountModel
        .create(
          [
            {
              business: businessId,
              limitKobo: approvedAmountInMoney.kobo,
              outstandingKobo: 0,
              availableKobo: approvedAmountInMoney.kobo,
              creditUtilization: 0,
              timeline: [
                {
                  status: CreditTimelineStatusT.APPROVED,
                  changedBy: adminId,
                  changedAt: new Date(),
                  note: `Credit initial limit set to ${approvedAmountInMoney.format()}`,
                },
              ],
            },
          ],
          { session },
        )
        .then((res) => res[0]);
    } else {
      // increase existing
      account.limitKobo = approvedAmountInMoney.kobo;
      account.availableKobo = Math.max(
        0,
        approvedAmountInMoney.kobo - account.outstandingKobo,
      );
      account.creditUtilization =
        account.limitKobo > 0
          ? (account.outstandingKobo / account.limitKobo) * 100
          : 0;
      account.timeline.unshift({
        status: CreditTimelineStatusT.APPROVED,
        changedBy: adminId,
        changedAt: new Date(),
        note: `Credit limit amount set to ${approvedAmountInMoney.format()}`,
      });
      await account.save({ session });
    }

    return account;
  }

  /**
   * Approves a credit request with detailed repayment parameters.
   * @param approvalDetails - The details of the approval including repayment terms.
   * @param requestId - The ID of the credit request to be approved.
   * @returns The updated credit request and generated repayment schedule.
   */
  async approveCreditRequestWithRepayment(
    approvalDetails: ApproveCreditRequestDto,
    requestId: string,
    admin: any,
  ): Promise<any> {
    const {
      approvedAmount,
      repaymentFrequency,
      repaymentDuration,
      customFrequencyDays,
      interestRate,
      gracePeriodDays = 0,
      overdueChargeRate = 0,
    } = approvalDetails;

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find the credit request by ID
      const creditRequest = await this.creditRequestModel
        .findById(requestId)
        .session(session);

      if (!creditRequest) {
        throw new ConflictException('Credit request not found');
      }

      // Check if the request is not pending
      if (creditRequest.status !== CreditStatus.PENDING) {
        throw new ConflictException('Credit request is not pending');
      }

      // Validate custom frequency days if frequency is CUSTOM
      if (
        repaymentFrequency === RepaymentFrequency.CUSTOM &&
        (!customFrequencyDays || customFrequencyDays <= 0)
      ) {
        throw new BadRequestException(
          'Custom frequency days is required when repayment frequency is CUSTOM',
        );
      }

      // Convert the approved amount from naira to kobo
      const approvedAmountInMoney = createMoney(approvedAmount, 'naira');
      const approvedAmountInKobo = approvedAmountInMoney.kobo;

      if (approvedAmountInKobo !== creditRequest.requestedAmountKobo) {
        throw new BadRequestException(
          'Approved amount must be equal to requested amount',
        );
      }

      // Calculate total interest and total repayment amount
      const principalAmount = approvedAmountInKobo;

      const dailyRatePercent = interestRate / 30;

      let totalDays = 0;

      if (repaymentFrequency === RepaymentFrequency.WEEKLY) {
        totalDays = 7 * repaymentDuration;
      }

      if (repaymentFrequency === RepaymentFrequency.MONTHLY) {
        totalDays = 30 * repaymentDuration;
      }

      if (repaymentFrequency === RepaymentFrequency.CUSTOM) {
        totalDays = customFrequencyDays * repaymentDuration;
      }

      const totalInterestAmount = Math.round(
        (principalAmount * dailyRatePercent * totalDays) / 100,
      );

      const totalRepaymentAmount = principalAmount + totalInterestAmount;

      // Calculate first payment date based on frequency
      const approvedDate = new Date();
      const firstPaymentDate = new Date(approvedDate);

      switch (repaymentFrequency) {
        case RepaymentFrequency.WEEKLY:
          firstPaymentDate.setDate(firstPaymentDate.getDate() + 7);
          break;
        case RepaymentFrequency.MONTHLY:
          firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
          break;
        case RepaymentFrequency.CUSTOM:
          firstPaymentDate.setDate(
            firstPaymentDate.getDate() + customFrequencyDays!,
          );
          break;
      }

      // Calculate final payment date
      const finalPaymentDate = new Date(firstPaymentDate);
      switch (repaymentFrequency) {
        case RepaymentFrequency.WEEKLY:
          finalPaymentDate.setDate(
            finalPaymentDate.getDate() + 7 * (repaymentDuration - 1),
          );
          break;
        case RepaymentFrequency.MONTHLY:
          finalPaymentDate.setMonth(
            finalPaymentDate.getMonth() + (repaymentDuration - 1),
          );
          break;
        case RepaymentFrequency.CUSTOM:
          finalPaymentDate.setDate(
            finalPaymentDate.getDate() +
              customFrequencyDays! * (repaymentDuration - 1),
          );
          break;
      }

      // Update the credit request
      creditRequest.status = CreditStatus.APPROVED;
      creditRequest.approvedAmountKobo = approvedAmountInKobo;
      creditRequest.repaymentFrequency = repaymentFrequency;
      creditRequest.repaymentDuration = repaymentDuration;
      creditRequest.customFrequencyDays = customFrequencyDays;
      creditRequest.interestRate = interestRate;
      creditRequest.gracePeriodDays = gracePeriodDays;
      creditRequest.overdueChargeRate = overdueChargeRate;
      creditRequest.approvedDate = approvedDate;
      creditRequest.firstPaymentDate = firstPaymentDate;
      creditRequest.finalPaymentDate = finalPaymentDate;
      creditRequest.totalInterestAmountKobo = totalInterestAmount;
      creditRequest.totalRepaymentAmountKobo = totalRepaymentAmount;
      creditRequest.isRepaymentScheduleGenerated = true;
      creditRequest.timeline.unshift({
        status: CreditTimelineStatusT.APPROVED,
        changedBy: admin.id,
        changedAt: new Date(),
        note: 'Credit request approved',
      });

      await creditRequest.save({ session });

      await this.addCreditToAccount({ creditRequest, admin, session });

      // Generate repayment schedule
      const schedules = await this.generateRepaymentSchedule(
        creditRequest,
        session,
      );

      // Populate business details
      await creditRequest.populate('business', 'businessName email phone');

      await this.accountingService.recordCredit(
        creditRequest.approvedAmountKobo,
        session,
      );

      await session.commitTransaction();

      await this.activityService.record({
        ...adminInitiator(admin),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Credit',
        objectId: String(creditRequest._id),
        description: `Approved credit request for ${(creditRequest.business as any)?.businessName ?? ''}`.trim(),
        metadata: {
          changes: {
            status: { old: CreditStatus.PENDING, new: CreditStatus.APPROVED },
          },
          terms: {
            approvedAmountKobo: creditRequest.approvedAmountKobo,
            repaymentFrequency: creditRequest.repaymentFrequency,
            repaymentDuration: creditRequest.repaymentDuration,
            customFrequencyDays: creditRequest.customFrequencyDays,
            interestRate: creditRequest.interestRate,
            gracePeriodDays: creditRequest.gracePeriodDays,
            overdueChargeRate: creditRequest.overdueChargeRate,
            firstPaymentDate: creditRequest.firstPaymentDate,
            finalPaymentDate: creditRequest.finalPaymentDate,
            totalRepaymentAmountKobo: creditRequest.totalRepaymentAmountKobo,
          },
        },
      });

      // SEND APPROVAL EMAIL TO BUSINESS
      await this.sendRequestApprovalNotifications(schedules, creditRequest);

      return successResponse(
        'Credit request approved successfully with repayment schedule',
        creditRequest,
      );
    } catch (error: any) {
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      session.endSession();
    }
  }

  async addCreditToAccount({
    creditRequest,
    admin,
    session,
  }: {
    creditRequest: any;
    admin: any;
    session: ClientSession;
  }) {
    const account = await this.creditAccountModel
      .findById(creditRequest.creditAccount)
      .session(session);
    if (!account) throw new NotFoundException('Account not found');

    if (creditRequest.approvedAmountKobo > account.availableKobo)
      throw new BadRequestException('Insufficient available credit');

    account.outstandingKobo += creditRequest.approvedAmountKobo;
    account.spendableAmountKobo += creditRequest.approvedAmountKobo;
    account.availableKobo = account.limitKobo - account.outstandingKobo;
    account.creditUtilization =
      account.limitKobo > 0
        ? (account.outstandingKobo / account.limitKobo) * 100
        : 0;
    account.timeline.unshift({
      status: CreditTimelineStatusT.APPROVED,
      changedBy: admin.id,
      changedAt: new Date(),
      note: `Approved credit ${creditRequest.requestType} of ${createMoney(creditRequest.approvedAmountKobo, 'kobo').format()}`,
    });
    await account.save({ session });
  }

  /**
   * Generates repayment schedule for an approved credit request.
   * @param creditRequest - The approved credit request.
   * @returns The generated repayment schedule.
   */
  private async generateRepaymentSchedule(
    creditRequest: any,
    session?: ClientSession,
  ): Promise<RepaymentScheduleDocument[]> {
    const schedule: RepaymentScheduleDocument[] = [];
    const principalPerInstallment = Math.round(
      creditRequest.approvedAmountKobo / creditRequest.repaymentDuration,
    );
    const interestPerInstallment = Math.round(
      creditRequest.totalInterestAmountKobo / creditRequest.repaymentDuration,
    );

    const currentDueDate = new Date(creditRequest.firstPaymentDate);

    for (let i = 1; i <= creditRequest.repaymentDuration; i++) {
      // Calculate grace period end date
      const gracePeriodEnd = new Date(currentDueDate);
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + creditRequest.gracePeriodDays,
      );

      // For the last installment, adjust amounts to handle rounding differences
      const isLastInstallment = i === creditRequest.repaymentDuration;
      let principalAmount = principalPerInstallment;
      let interestAmount = interestPerInstallment;

      if (isLastInstallment) {
        // Calculate remaining amounts to ensure total matches exactly
        const totalPrincipalSoFar = principalPerInstallment * (i - 1);
        const totalInterestSoFar = interestPerInstallment * (i - 1);

        principalAmount =
          creditRequest.approvedAmountKobo - totalPrincipalSoFar;
        interestAmount =
          creditRequest.totalInterestAmountKobo - totalInterestSoFar;
      }

      const totalAmount = principalAmount + interestAmount;

      const repaymentSchedule = new this.repaymentScheduleModel({
        creditRequest: creditRequest._id,
        creditAccount: creditRequest.creditAccount,
        business: creditRequest.business,
        installmentNumber: i,
        principalAmountKobo: principalAmount,
        interestAmountKobo: interestAmount,
        totalAmountKobo: totalAmount,
        remainingAmountKobo: totalAmount,
        dueDate: new Date(currentDueDate),
        gracePeriodEnd,
        status: RepaymentStatus.PENDING,
      });

      await repaymentSchedule.save({ session });
      schedule.push(repaymentSchedule);

      // Calculate next due date
      switch (creditRequest.repaymentFrequency) {
        case RepaymentFrequency.WEEKLY:
          currentDueDate.setDate(currentDueDate.getDate() + 7);
          break;
        case RepaymentFrequency.MONTHLY:
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
          break;
        case RepaymentFrequency.CUSTOM:
          currentDueDate.setDate(
            currentDueDate.getDate() + creditRequest.customFrequencyDays,
          );
          break;
      }
    }

    return schedule;
  }

  private async sendRequestApprovalNotifications(
    schedules: RepaymentScheduleDocument[],
    creditRequest: CreditRequestDocument,
  ) {
    const scheduleRows = schedules
      .map(
        (s) => `
        <tr>
          <td style="padding: 14px 16px; font-family: 'Inter', sans-serif; font-size: 13px; color: #344054;">
            ${new Date(s.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </td>
          <td align="right" style="padding: 14px 16px; font-family: 'Inter', sans-serif; font-size: 13px; color: #101928;">
            ${createMoney(s.totalAmountKobo, 'kobo').format()}
          </td>
        </tr>
      `,
      )
      .join('');

    await this.sendCreditNotification(
      creditRequest.business._id,
      {
        subject:
          creditRequest.requestType === CreditRequestTypeT.INITIAL
            ? 'Credit Request Approved'
            : 'Credit Top-up Request Approved',
        template: 'credit-request-approved',
        variables: {
          BUSINESS_NAME: creditRequest.business.businessName,
          REQUEST_TYPE:
            creditRequest.requestType === CreditRequestTypeT.INITIAL
              ? 'credit request'
              : 'credit top-up request',
          GRACE_PERIOD_MESSAGE:
            creditRequest.gracePeriodDays > 0
              ? `You have a ${creditRequest.gracePeriodDays}-day grace period after each due date before penalties apply.`
              : '',
          OVERDUE_FEE_MESSAGE:
            creditRequest.overdueChargeRate > 0
              ? `A late fee of ${creditRequest.overdueChargeRate}% will be applied if payment is not made after the grace period.`
              : '',
          APPROVED_AMOUNT: createMoney(
            creditRequest.approvedAmountKobo,
            'kobo',
          ).format(),
          REPAYMENT_SCHEDULE_ROWS: scheduleRows,
        },
      },
      {
        title: 'Credit Request Approved',
        body: `Your credit request has been approved. Please check your email for more information.`,
      },
    );
  }

  private async sendCreditNotification(
    businessId: any,
    email: { subject: string; template: string; variables: any },
    push: { title: string; body: string },
  ) {
    await this.creditQueue.add(JOB_NAMES.SEND_ADMIN_CREDIT_NOTIFICATION, {
      businessId,
      email,
      push,
    });
  }
}
