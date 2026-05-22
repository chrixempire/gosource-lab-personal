import { GetPaymentHistoryQueryDto } from '../../../credit/dto/repayment.dto';
import { RepaymentStatus } from '../../../credit/enum/repayment.enum';

export const buildPaymentAggregator = (
  queryParams: GetPaymentHistoryQueryDto,
) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;
  const filter: Record<string, any> = {};

  if (queryParams.creditRequestId) {
    filter.creditRequest = queryParams.creditRequestId;
  }

  if (queryParams.businessId) {
    filter.business = queryParams.businessId;
  }

  if (queryParams.paymentMethod) {
    filter.paymentMethod = queryParams.paymentMethod;
  }

  if (queryParams.fromDate || queryParams.toDate) {
    filter.createdAt = {
      ...(queryParams.fromDate && { $gte: new Date(queryParams.fromDate) }),
      ...(queryParams.toDate && { $lte: new Date(queryParams.toDate) }),
    };
  }

  if (queryParams.search) {
    const searchRegex = new RegExp(queryParams.search, 'i');
    filter.$or = [{ referenceCode: searchRegex }, { paymentNote: searchRegex }];
  }

  const sort = {
    [sortBy]: sortOrder === 'desc' ? -1 : 1,
  };

  const skip = (page - 1) * limit;

  return [
    { $match: filter },

    {
      $facet: {
        // Paginated data
        data: [
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },

          // Populate business
          {
            $lookup: {
              from: 'businesscustomers',
              localField: 'business',
              foreignField: '_id',
              as: 'business',
            },
          },
          { $unwind: { path: '$business', preserveNullAndEmptyArrays: true } },

          // Populate creditAccount
          {
            $lookup: {
              from: 'creditaccounts',
              localField: 'creditAccount',
              foreignField: '_id',
              as: 'creditAccount',
            },
          },
          {
            $unwind: {
              path: '$creditAccount',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],

        // Meta count
        meta: [{ $count: 'total' }],
      },
    },
  ];
};

export const buildRepaymentAggregator = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  return [
    {
      $facet: {
        totalPaidRepayments: [
          { $group: { _id: null, total: { $sum: '$paidAmountKobo' } } },
        ],

        outstandingRepayments: [
          {
            $match: {
              status: { $ne: RepaymentStatus.PAID },
            },
          },
          { $group: { _id: null, total: { $sum: '$remainingAmountKobo' } } },
        ],

        overduePaymentsCount: [
          { $match: { status: RepaymentStatus.OVERDUE } },
          { $count: 'count' },
        ],

        dueThisWeek: [
          {
            $match: {
              dueDate: { $gte: today, $lte: next7Days },
              status: { $ne: RepaymentStatus.PAID },
            },
          },
          { $count: 'count' },
        ],

        dueThisMonth: [
          {
            $match: {
              dueDate: { $gte: today, $lte: next30Days },
              status: { $ne: RepaymentStatus.PAID },
            },
          },
          { $count: 'count' },
        ],
      },
    },
  ];
};
