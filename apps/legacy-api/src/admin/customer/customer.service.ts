import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { Model, Types } from 'mongoose';
import { Order } from '../../order/entities/order.entity';
import { Wallet } from '../../wallet/schema/wallet.schema';
import { WalletTransaction } from '../../wallet/schema/walletTransaction.schema';
import {
  CustomerFilterUtil,
  CustomerFiterParams,
  OrderFilterParams,
  OrderFilterUtil,
  TransactionFiterParams,
  WalletTransactionFilterUtil,
} from '../../utils/filter';
import { Branch } from '../../branch/entities/branch.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { getCustomerOrderStats } from '../../utils/helpers';
import { CreditRequest } from '../../credit/schema/creditRequest';
import { successResponse } from '../../utils/responses';
import { CreditStatus } from '../../credit/enum/credit.enum';
import { CreditAccount } from '../../credit/schema/creditAccount.schema';
import { DateFilterDto } from '../product/dto/create-product.dto';
import { getDateFilter } from '../../utils/helpers';
import { parseISO } from 'date-fns';
import { AuthService } from '../../auth/auth.service';
import { ActivityService } from '../../activity/activity.service';
import { adminInitiator } from '../../utils/activity-initiator.util';
import { ACTIVITY_LOG_ACTION_TYPE } from '../../activity/interface/activityLog.interface';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(BusinessCustomer.name)
    private businessCustomerModel: Model<BusinessCustomer>,
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(Wallet.name)
    private walletModel: Model<Wallet>,
    @InjectModel(WalletTransaction.name)
    private transactionModel: Model<WalletTransaction>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    @InjectModel(CreditAccount.name)
    private creditAccountModel: Model<CreditAccount>,
    private readonly authService: AuthService,
    private readonly activityService: ActivityService,
  ) {}

  private customerLabel(customer: { businessName?: string; email?: string }) {
    return customer?.businessName || customer?.email || '';
  }

  async resetCustomerPassword(customerId: string, admin?: any) {
    const customer = await this.businessCustomerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.OTHERS,
      module: 'Customers',
      objectId: customerId,
      description: `Reset password for customer ${this.customerLabel(customer)}`.trim(),
    });

    return this.authService.sendPasswordResetMail({ email: customer.email });
  }

  async setCustomerActive(customerId: string, active: boolean, admin?: any) {
    const existing = await this.businessCustomerModel.findById(customerId).exec();
    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    const customer = await this.businessCustomerModel
      .findByIdAndUpdate(customerId, { active }, { new: true })
      .exec();

    await this.activityService.record({
      ...adminInitiator(admin),
      action: active
        ? ACTIVITY_LOG_ACTION_TYPE.ACTIVATE
        : ACTIVITY_LOG_ACTION_TYPE.DEACTIVATE,
      module: 'Customers',
      objectId: customerId,
      description: `${active ? 'Activated' : 'Deactivated'} customer ${this.customerLabel(existing)}`.trim(),
      metadata: {
        changes: { active: { old: existing.active ?? null, new: active } },
      },
    });

    return successResponse(
      active ? 'Customer activated successfully' : 'Customer deactivated successfully',
      customer,
    );
  }

  async deleteCustomer(customerId: string, admin?: any) {
    const customer = await this.businessCustomerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.businessCustomerModel.findByIdAndDelete(customerId).exec();

    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.DELETE,
      module: 'Customers',
      objectId: customerId,
      description: `Deleted customer ${this.customerLabel(customer)}`.trim(),
    });

    return successResponse('Customer account deleted successfully', null);
  }

  /**
   * Get all customers.
   *
   * @param queryParams
   * @returns {object}
   */
  async getCustomers(queryParams: CustomerFiterParams): Promise<any> {
    const { limit = 10, page = 1, ...filters } = queryParams;

    // Validate filters
    const validation = CustomerFilterUtil.validateFilters(filters);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid filters: ${validation.errors.join(', ')}`,
      );
    }

    // Build the query filter
    const filterQuery = CustomerFilterUtil.buildFilterQuery(filters);

    const [customers, total] = await Promise.all([
      this.businessCustomerModel
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.businessCustomerModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      status: true,
      message: 'Customers fetched successfully',
      data: customers,
      meta: {
        page,
        limit,
        totalDocuments: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single customer by id.
   *
   * @param customerId
   * @returns {object}
   */
  async getCustomerById(customerId: string): Promise<any> {
    const [customer, ordersData, wallet, branches, employees] =
      await Promise.all([
        this.businessCustomerModel.findById(customerId).lean().exec(),
        this.orderModel
          .find({
            $or: [{ business: customerId }, { customerId }],
          })
          .sort({ createdAt: 1 }),
        this.walletModel.findOne({ customer: customerId }),
        this.branchModel.find({ businessId: customerId }),
        this.employeeModel.find({ businessId: customerId }),
      ]);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const ordersSummary = getCustomerOrderStats(ordersData);
    const orders = {
      totalOrders: ordersSummary.totalOrders,
      totalSpent: ordersSummary.totalSpent,
    };
    const totalBranches = branches?.length || 0;
    const totalEmployees = employees?.length || 0;

    return {
      status: true,
      message: 'Customer fetched successfully',
      data: { customer, orders, wallet, totalBranches, totalEmployees },
    };
  }

  async getCustomerTransactions(
    customerId: string,
    queryParams: TransactionFiterParams,
  ) {
    const { page = 1, limit = 10, ...filters } = queryParams;

    const getBusiness = await this.businessCustomerModel.findById(customerId);

    if (!getBusiness) {
      throw new NotFoundException('Customer not found');
    }

    const validation = WalletTransactionFilterUtil.validateFilters(filters);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid filters: ${validation.errors.join(', ')}`,
      );
    }
    // Build the query filter
    const filterQuery = WalletTransactionFilterUtil.buildFilterQuery(filters);

    filterQuery.business = customerId;
    const [data, total] = await Promise.all([
      this.transactionModel
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.transactionModel.countDocuments(filterQuery),
    ]);

    return {
      message: 'Transactions fetched successfully',
      data: data,
      pagination: {
        total: total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerOrders(customerId: string, queryParams: OrderFilterParams) {
    const { page = 1, limit = 10, ...filters } = queryParams;

    const getBusiness = await this.businessCustomerModel.findById(customerId);

    if (!getBusiness) {
      throw new NotFoundException('Customer not found');
    }

    // Validate filters
    const validation = OrderFilterUtil.validateFilters(filters);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid filters: ${validation.errors.join(', ')}`,
      );
    }

    // Build the query filter
    const filterQuery = OrderFilterUtil.buildFilterQuery(filters);
    filterQuery.$or = [{ business: customerId }, { customerId }];
    const skip = (page - 1) * limit;

    // Execute query with population
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filterQuery)
        .populate({
          path: 'products',
          populate: {
            path: 'product',
            model: 'Product',
          },
        })
        .populate('business')
        .populate('branch')
        .populate({
          path: 'request',
          populate: {
            path: 'initiator',
            model: 'Employee',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      status: true,
      message: 'Customer orders fetched successfully',
      data: {
        orders,
        meta: {
          totalDocuments: total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  }

  async getCustomerOrdersSummary(customerId: string) {
    const getBusiness = await this.businessCustomerModel.findById(customerId);

    if (!getBusiness) {
      throw new NotFoundException('Customer not found');
    }
    // For some weird reason, using aggregator doesn't work for orderModel on prod db.
    const orders = await this.orderModel
      .find({
        $or: [{ business: customerId }, { customerId }],
      })
      .sort({ createdAt: 1 })
      .lean();

    const data = getCustomerOrderStats(orders);

    return {
      status: true,
      message: 'Customer orders summary fetched successfully',
      data,
    };
  }

  async getBusinessBranches(
    businessId: string,
    queryParams: TransactionFiterParams,
  ) {
    const { page = 1, limit = 10, ...filters } = queryParams;

    const getBusiness = await this.businessCustomerModel.findById(businessId);
    if (!getBusiness) {
      throw new NotFoundException('Customer not found');
    }

    const validation = WalletTransactionFilterUtil.validateFilters(filters);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid filters: ${validation.errors.join(', ')}`,
      );
    }
    // Build the query filter using WalletTransactionFilterUtil since they have almost similar queries
    const filterQuery = WalletTransactionFilterUtil.buildFilterQuery(filters);
    const skip = (page - 1) * limit;
    const branchQuery = { businessId };
    if (filterQuery['createdAt']) {
      branchQuery['createdAt'] = filterQuery['createdAt'];
    }
    if (filterQuery['reference']) {
      branchQuery['branchName'] = filterQuery['reference'];
    }
    const [branches, total] = await Promise.all([
      await this.branchModel
        .find(branchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.branchModel.countDocuments(branchQuery).exec(),
    ]);

    const branchesWithEmployees = await Promise.all(
      branches.map(async (branch) => {
        const employees = await this.employeeModel
          .find({ branchId: branch._id })
          .lean();

        const matchStage: any = { branch: branch._id };
        if (filterQuery['amount']) {
          matchStage.totalPrice = filterQuery['amount'];
        }
        const result = await this.orderModel.aggregate([
          {
            $match: matchStage,
          },
          {
            $group: {
              _id: '$branch',
              totalAmountProcured: { $sum: '$totalPrice' },
              totalItemsPurchased: { $sum: '$products.quantity' },
              totalOrders: { $sum: 1 },
            },
          },
        ]);

        const totalAmountProcured = result[0]?.totalAmountProcured
          ? result[0].totalAmountProcured
          : 0;
        const totalItemsPurchased = result[0]?.totalItemsPurchased
          ? result[0].totalItemsPurchased
          : 0;
        const totalOrders = result[0]?.totalOrders ? result[0].totalOrders : 0;

        return {
          ...branch.toObject(),
          employees,
          totalOrders,
          totalItemsPurchased,
          totalAmountProcured,
        };
      }),
    );

    return {
      status: true,
      message: 'Business branches fetched successfully',
      data: {
        branches: branchesWithEmployees,
        meta: {
          totalDocuments: total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  }

  // Turn on credit
  /**
   * Enable credit purchasing for a customer
   *
   * @param customerId - The ID of the customer
   * @param creditLimit - Optional credit limit amount
   * @returns {object} - Operation status and updated customer data
   */
  async enableCredit(
    customerId: string,
    creditLimit?: number,
    admin?: any,
  ): Promise<any> {
    try {
      const customer = await this.businessCustomerModel.findById(customerId);

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Update credit settings
      const updatedCustomer = await this.businessCustomerModel
        .findByIdAndUpdate(
          customerId,
          {
            canBuyOnCredit: true,
            creditAccount: creditLimit || customer.creditAccount,
          },
          { new: true },
        )
        .lean();

      await this.activityService.record({
        ...adminInitiator(admin),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Customers',
        objectId: customerId,
        description: `Enabled credit for customer ${this.customerLabel(customer)}`.trim(),
        metadata: {
          changes: {
            canBuyOnCredit: { old: customer.canBuyOnCredit ?? false, new: true },
            ...(creditLimit
              ? { creditAccount: { old: customer.creditAccount ?? null, new: creditLimit } }
              : {}),
          },
        },
      });

      return {
        status: true,
        message: 'Credit enabled successfully',
        data: updatedCustomer,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to enable credit',
        error: error.message,
      };
    }
  }

  /**
   * Disable credit purchasing for a customer
   *
   * @param customerId - The ID of the customer
   * @returns {object} - Operation status and updated customer data
   */
  async disableCredit(customerId: string, admin?: any): Promise<any> {
    try {
      const customer = await this.businessCustomerModel.findById(customerId);

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      // Disable credit
      const updatedCustomer = await this.businessCustomerModel
        .findByIdAndUpdate(customerId, { canBuyOnCredit: false }, { new: true })
        .lean();

      await this.activityService.record({
        ...adminInitiator(admin),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Customers',
        objectId: customerId,
        description: `Disabled credit for customer ${this.customerLabel(customer)}`.trim(),
        metadata: {
          changes: {
            canBuyOnCredit: { old: customer.canBuyOnCredit ?? true, new: false },
          },
        },
      });

      return {
        status: true,
        message: 'Credit disabled successfully',
        data: updatedCustomer,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Failed to disable credit',
        error: error.message,
      };
    }
  }

  async getCustomerCreditHistory(
    customerId: string,
    queryParams: TransactionFiterParams,
  ) {
    const { page = 1, limit = 10, ...filters } = queryParams;

    const getBusiness = await this.businessCustomerModel.findById(customerId);

    if (!getBusiness) {
      throw new NotFoundException('Customer not found');
    }
    const result = await this.creditRequestModel.aggregate([
      {
        $match: {
          business: new Types.ObjectId(customerId),
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: 'repaymentschedules',
                localField: '_id',
                foreignField: 'creditRequest',
                as: 'schedules',
              },
            },
            {
              $addFields: {
                totalRepaidAmountKobo: { $sum: '$schedules.paidAmountKobo' },
                totalOverdueAmountKobo: {
                  $sum: '$schedules.overdueChargesKobo',
                },
                schedulesCount: { $size: '$schedules' },
              },
            },
            {
              $project: { schedules: 0 },
            },
          ],
        },
      },
    ]);

    const total = result[0]?.metadata[0]?.total || 0;
    const creditRequests = result[0]?.data || [];

    return successResponse('Credit history fetched successfully', {
      creditRequests,
      pagination: {
        total: total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async getCustomerCreditSummary(customerId: string) {
    const getBusiness = await this.businessCustomerModel.findById(customerId);

    if (!getBusiness) {
      throw new NotFoundException('Customer not found');
    }

    const objectId = new Types.ObjectId(customerId);

    const [creditRequests, creditAccount] = await Promise.all([
      this.creditRequestModel
        .find({
          business: objectId,
          status: {
            $in: [CreditStatus.APPROVED, CreditStatus.COMPLETED],
          },
        })
        .select('approvedAmountKobo status'),
      this.creditAccountModel.findOne({
        business: objectId,
      }),
    ]);

    const totalCreditCollected = creditRequests.reduce(
      (acc, req) => acc + (req.approvedAmountKobo || 0),
      0,
    );

    return successResponse('Credit summary fetched successfully', {
      creditAccount: creditAccount || null,
      totalCreditCollected,
      totalApprovedRequests: creditRequests.length,
    });
  }

  async getCustomerRanking(query: DateFilterDto) {
    const {
      startDate,
      endDate,
      filterType,
      sortOrder = 'desc',
      limit = 10,
      page = 1,
    } = query;

    const customDateRange =
      startDate && endDate
        ? { start: parseISO(startDate), end: parseISO(endDate) }
        : undefined;

    const dateFilter = getDateFilter(filterType, customDateRange);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const safeLimit = Math.max(1, Number(limit) || 10);
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const [aggregation] = await this.orderModel.aggregate([
      {
        $match: {
          ...dateFilter,
          business: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$business',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalPrice', 0] } },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
      {
        $lookup: {
          from: 'businesscustomers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $addFields: {
          customer: { $arrayElemAt: ['$customer', 0] },
        },
      },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          businessName: '$customer.businessName',
          email: '$customer.email',
          totalOrders: 1,
          totalSpent: 1,
          lastOrderAt: 1,
        },
      },
      {
        $sort: {
          totalOrders: sortDirection,
          totalSpent: sortDirection,
        },
      },
      {
        $facet: {
          meta: [{ $count: 'total' }],
          items: [{ $skip: skip }, { $limit: safeLimit }],
        },
      },
    ]);

    const total = aggregation?.meta?.[0]?.total ?? 0;
    const customers = aggregation?.items ?? [];
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return successResponse('Customer ranking fetched successfully', {
      customers,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
      dateRange: {
        filterType,
        startDate,
        endDate,
      },
    });
  }
}
