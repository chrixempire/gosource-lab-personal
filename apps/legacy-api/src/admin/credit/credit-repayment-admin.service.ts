import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepaymentSchedule } from '../../credit/schema/repaymentSchedule.schema';
import { RepaymentStatus } from '../../credit/enum/repayment.enum';
import { CreditRequest } from '../../credit/schema/creditRequest';
import { successResponse } from '../../utils/responses';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { paginationUtil } from '../../utils/pagination';
import { GetPaymentHistoryQueryDto } from '../../credit/dto/repayment.dto';
import { CreditPaymentReference } from '../../credit/schema/creditPaymentReference.schema';
import {
  buildPaymentAggregator,
  buildRepaymentAggregator,
} from './helpers/payment-history.pipeline';
import { CreditStatus } from '../../credit/enum/credit.enum';

@Injectable()
export class CreditRepaymentAdminService {
  constructor(
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    @InjectModel(RepaymentSchedule.name)
    private repaymentScheduleModel: Model<RepaymentSchedule>,
    @InjectModel(CreditPaymentReference.name)
    private creditPaymentReferenceModel: Model<CreditPaymentReference>,
  ) {}

  /**
   * Gets the repayment schedule for a credit request.
   * @param requestId - The ID of the credit request.
   * @param queryParams - Query parameters for filtering and pagination.
   * @returns The repayment schedule.
   */
  async getRepaymentSchedule(
    requestId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { limit = 10, page = 1 } = queryParams;

    // Verify that the credit request exists
    const creditRequest = await this.creditRequestModel.findById(requestId);
    if (!creditRequest) {
      throw new ConflictException('Credit request not found');
    }

    const filter = { creditRequest: requestId };

    const result = await paginationUtil.paginate({
      model: this.repaymentScheduleModel,
      page,
      limit,
      filter,
      sort: { installmentNumber: 1 },
      populate: [
        {
          path: 'business',
          select: 'businessName email phone',
        },
      ],
    });

    const schedule = result.data;
    const meta = result.meta;

    // Calculate summary statistics
    const totalScheduled = schedule.reduce(
      (sum: number, item: any) => sum + item.totalAmountKobo,
      0,
    );
    const totalPaid = schedule.reduce(
      (sum: number, item: any) => sum + item.paidAmountKobo,
      0,
    );
    const totalRemaining = schedule.reduce(
      (sum: number, item: any) => sum + item.remainingAmountKobo,
      0,
    );

    const overdueCount = schedule.filter(
      (item: any) => item.status === RepaymentStatus.OVERDUE,
    ).length;

    const summary = {
      totalScheduled,
      totalPaid,
      totalRemaining,
      overdueCount,
      totalInstallments: creditRequest.repaymentDuration,
      completedInstallments: schedule.filter(
        (item: any) => item.status === RepaymentStatus.PAID,
      ).length,
    };

    return successResponse('Repayment schedule retrieved successfully', {
      schedule,
      meta,
      summary,
      creditRequest: {
        id: creditRequest._id,
        approvedAmountKobo: creditRequest.approvedAmountKobo,
        repaymentFrequency: creditRequest.repaymentFrequency,
        interestRate: creditRequest.interestRate,
        gracePeriodDays: creditRequest.gracePeriodDays,
      },
    });
  }

  /**
   * Processes a repayment payment.
   * @param scheduleId - The ID of the repayment schedule item.
   * @param paymentAmount - The amount being paid.
   * @param paymentDetails - Additional payment details.
   * @returns The updated repayment schedule item.
   */
  // async processRepayment(
  //   scheduleId: string,
  //   paymentAmount: number,
  //   paymentDetails: any,
  // ): Promise<any> {
  //   const schedule = await this.repaymentScheduleModel.findById(scheduleId);

  //   if (!schedule) {
  //     throw new NotFoundException('Repayment schedule not found');
  //   }

  //   if (schedule.status === RepaymentStatus.PAID) {
  //     throw new BadRequestException('This installment has already been paid');
  //   }

  //   // Convert payment amount from naira to kobo
  //   const paymentAmountInKobo = paymentAmount * 100;

  //   // Update payment details
  //   const previousPaidAmount = schedule.paidAmountKobo;
  //   const newPaidAmount = previousPaidAmount + paymentAmountInKobo;
  //   const newRemainingAmount = Math.max(
  //     0,
  //     schedule.totalAmountKobo - newPaidAmount,
  //   );

  //   schedule.paidAmountKobo = newPaidAmount;
  //   schedule.remainingAmountKobo = newRemainingAmount;
  //   schedule.paidDate = new Date();
  //   schedule.paymentMethod = paymentDetails.paymentMethod;
  //   schedule.transactionReference = paymentDetails.transactionReference;
  //   schedule.paymentNote = paymentDetails.paymentNote;

  //   // Update status based on payment
  //   if (newRemainingAmount === 0) {
  //     schedule.status = RepaymentStatus.PAID;
  //   } else if (newPaidAmount > 0) {
  //     schedule.status = RepaymentStatus.PARTIALLY_PAID;
  //   }

  //   await schedule.save();

  //   // Update overdue status if needed
  //   await this.updateOverdueStatus(schedule);

  //   return successResponse('Payment processed successfully', schedule);
  // }

  // /**
  //  * Updates overdue status for a repayment schedule.
  //  * @param schedule - The repayment schedule to check.
  //  */
  // private async updateOverdueStatus(
  //   schedule: RepaymentScheduleDocument,
  // ): Promise<void> {
  //   const now = new Date();
  //   const gracePeriodEnd = schedule.gracePeriodEnd || schedule.dueDate;

  //   if (
  //     now > gracePeriodEnd &&
  //     schedule.remainingAmountKobo > 0 &&
  //     schedule.status !== RepaymentStatus.PAID
  //   ) {
  //     const alreadyOverdue = schedule.status === RepaymentStatus.OVERDUE;

  //     const daysOverdue = Math.floor(
  //       (now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
  //     );

  //     schedule.isOverdue = true;
  //     schedule.daysOverdue = daysOverdue;
  //     schedule.status = RepaymentStatus.OVERDUE;

  //     if (!alreadyOverdue) {
  //       // Calculate overdue charges if applicable
  //       const creditRequest = await this.creditRequestModel.findById(
  //         schedule.creditRequest,
  //       );
  //       if (creditRequest && creditRequest.overdueChargeRate > 0) {
  //         const overdueCharges = Math.round(
  //           (schedule.remainingAmountKobo * creditRequest.overdueChargeRate) /
  //             100,
  //         );
  //         schedule.overdueChargesKobo = overdueCharges;
  //         schedule.totalAmountKobo += overdueCharges;
  //         schedule.remainingAmountKobo += overdueCharges;
  //       }
  //     }

  //     await schedule.save();
  //   }
  // }

  /**
   * Gets overdue repayments across all credit requests.
   * @param queryParams - Query parameters for filtering and pagination.
   * @returns List of overdue repayments.
   */
  async getOverdueRepaymentSchedules(
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { limit = 50, page = 1 } = queryParams;

    const filter = {
      isOverdue: true,
      status: {
        $in: [RepaymentStatus.OVERDUE, RepaymentStatus.PARTIALLY_PAID],
      },
    };

    const result = await paginationUtil.paginate({
      model: this.repaymentScheduleModel,
      page,
      limit,
      filter,
      sort: { daysOverdue: -1, dueDate: 1 },
      populate: [
        {
          path: 'business',
          select: 'businessName email phone',
        },
        {
          path: 'creditRequest',
          select: 'approvedAmountKobo interestRate overdueChargeRate',
        },
      ],
    });

    const overdueRepayments = result.data;
    const meta = result.meta;

    // Calculate summary
    const totalOverdueAmount = overdueRepayments.reduce(
      (sum: number, item: any) => sum + item.remainingAmountKobo,
      0,
    );

    const summary = {
      totalOverdueAmount,
      totalOverdueCount: meta.total,
      averageDaysOverdue:
        overdueRepayments.length > 0
          ? Math.round(
              (overdueRepayments.reduce(
                (sum: number, item: any) => sum + item.daysOverdue,
                0,
              ) as number) / overdueRepayments.length,
            )
          : 0,
    };

    return successResponse('Overdue repayments retrieved successfully', {
      overdueRepayments,
      meta,
      summary,
    });
  }

  /**
   * Gets all repayments across all credit requests with pagination and filtering.
   * @param queryParams - Query parameters for filtering and pagination.
   * @returns Paginated list of all repayments.
   */
  async getAllRepaymentSchedules(
    queryParams: QueryParamsDto & any,
  ): Promise<any> {
    const {
      limit = 50,
      page = 1,
      status,
      businessId,
      fromDate,
      toDate,
      isOverdue,
      sortBy = 'dueDate',
      sortOrder = 'desc',
      search,
      paymentMethod,
      creditRequestId,
    } = queryParams;

    // Build filter object
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (businessId) {
      filter.business = businessId;
    }

    if (creditRequestId) {
      filter.creditRequest = creditRequestId;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (isOverdue !== undefined) {
      filter.isOverdue = isOverdue === 'true' || isOverdue === true;
    }

    // Date range filtering
    if (fromDate || toDate) {
      filter.dueDate = {};
      if (fromDate) {
        filter.dueDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.dueDate.$lte = new Date(toDate);
      }
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { transactionReference: { $regex: search, $options: 'i' } },
        { paymentNote: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const result = await paginationUtil.paginate({
      model: this.repaymentScheduleModel,
      page,
      limit,
      filter,
      sort,
      populate: [
        {
          path: 'business',
          select: 'businessName email phone',
        },
        {
          path: 'creditRequest',
          select:
            'approvedAmountKobo interestRate repaymentFrequency overdueChargeRate',
        },
      ],
    });

    const repayments = result.data;
    const meta = result.meta;

    // Calculate summary statistics
    const totalScheduledAmount = repayments.reduce(
      (sum: number, item: any) => sum + item.totalAmountKobo,
      0,
    );

    const totalPaidAmount = repayments.reduce(
      (sum: number, item: any) => sum + item.paidAmountKobo,
      0,
    );

    const totalRemainingAmount = repayments.reduce(
      (sum: number, item: any) => sum + item.remainingAmountKobo,
      0,
    );

    const statusBreakdown = repayments.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const overdueRepayments = repayments.filter(
      (item: any) => item.isOverdue === true,
    );

    const totalOverdueAmount = overdueRepayments.reduce(
      (sum: number, item: any) => sum + item.remainingAmountKobo,
      0,
    );

    const summary = {
      totalRepayments: meta.total,
      totalScheduledAmount,
      totalPaidAmount,
      totalRemainingAmount,
      totalOverdueAmount,
      overdueCount: overdueRepayments.length,
      statusBreakdown,
      collectionRate:
        (totalScheduledAmount as number) > 0
          ? Math.round(
              ((totalPaidAmount as number) / (totalScheduledAmount as number)) *
                100 *
                100,
            ) / 100
          : 0,
    };

    return successResponse('All repayments retrieved successfully', {
      repayments,
      meta,
      summary,
    });
  }

  async getAllPaymentHistory(queryParams: GetPaymentHistoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryParams;
    const filters = { ...queryParams, page, limit, sortBy, sortOrder };
    const [paymentsAggregated, schedulesAggregated, requestsAggregated] =
      await Promise.all([
        this.creditPaymentReferenceModel.aggregate(
          buildPaymentAggregator(filters) as any,
        ),
        this.repaymentScheduleModel.aggregate(buildRepaymentAggregator()),
        this.creditRequestModel.aggregate([
          {
            $match: {
              status: {
                $in: [
                  CreditStatus.APPROVED,
                  CreditStatus.COMPLETED,
                  CreditStatus.DEFAULTED,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalCreditDisbursedKobo: { $sum: '$approvedAmountKobo' },
            },
          },
        ]),
      ]);

    const repayments = paymentsAggregated[0]?.data || [];
    const total = paymentsAggregated[0]?.meta[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    const schedules = schedulesAggregated[0] || {};
    const totalCreditDisbursedKobo =
      requestsAggregated[0]?.totalCreditDisbursedKobo || 0;

    const summary = {
      totalCreditDisbursedKobo,
      totalPaidRepaymentsKobo: schedules.totalPaidRepayments?.[0]?.total || 0,
      outstandingRepaymentsKobo:
        schedules.outstandingRepayments?.[0]?.total || 0,
      overduePaymentsCount: schedules.overduePaymentsCount?.[0]?.count || 0,
      dueThisWeekCount: schedules.dueThisWeek?.[0]?.count || 0,
      dueThisMonthCount: schedules.dueThisMonth?.[0]?.count || 0,
    };

    return successResponse('All repayments retrieved successfully', {
      repayments,
      meta,
      summary,
    });
  }
}
