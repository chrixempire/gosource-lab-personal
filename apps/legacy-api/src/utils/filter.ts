import mongoose, { FilterQuery } from 'mongoose';
import { ORDER_STATUS } from '../order/interface/order.interface';
import { Order } from '../order/entities/order.entity';
import { buildBooleanQuery, escapeRegex } from './helpers';
import { WalletTransaction } from '../wallet/schema/walletTransaction.schema';
import { TransactionStatus } from '../wallet/enum/wallet.enum';
import { AccountType } from '../business/enum/business.enum';
import { BusinessCustomer } from '../business/schema/business.schema';

export interface OrderFilterParams {
  // Amount filtering
  amountFrom?: number;
  amountTo?: number;

  page?: number;

  limit?: number;

  // Customer filtering
  customerId?: string;

  name?: string;

  reference?: string;

  // Payment method filtering
  paymentMethod?: string | string[];

  category?: string | string[];

  unit?: string | string[];

  trackQuantity?: boolean;

  // Payment status
  paymentStatus?: string | string[];

  productStatus?: string | string[];

  // Status filtering
  status?: ORDER_STATUS | ORDER_STATUS[];

  inStock?: boolean;

  // Date range filtering
  startDate?: Date | string;
  endDate?: Date | string;

  // Additional filters
  business?: string;
  branch?: string;
}

export interface TransactionFiterParams {
  page?: number;

  limit?: number;

  // Date range filtering
  startDate?: Date | string;
  endDate?: Date | string;

  // Amount filtering
  amountFrom?: number;
  amountTo?: number;

  name?: string;

  // Status filtering
  status?: TransactionStatus | TransactionStatus[];
}

export interface CustomerFiterParams {
  page?: number;

  limit?: number;

  // Date range filtering
  startDate?: Date | string;
  endDate?: Date | string;

  // filter by search
  search?: string;

  // Amount filtering
  amountFrom?: number;
  amountTo?: number;

  customerStatus: string | string[];
  useCredit: string | string[];

  // account type filtering
  accountType?: AccountType | AccountType[];
}

export class AmountDateValidation {
  /**
   * Validates filter parameters
   * @param filters - The filter parameters to validate
   * @returns Validation result with any errors
   */
  static validateFilters(filters: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate amount range
    if (filters.amountFrom !== undefined && filters.amountFrom < 0) {
      errors.push('Amount from must be non-negative');
    }

    if (filters.amountTo !== undefined && filters.amountTo < 0) {
      errors.push('Amount to must be non-negative');
    }

    if (
      filters.amountFrom !== undefined &&
      filters.amountTo !== undefined &&
      filters.amountFrom > filters.amountTo
    ) {
      errors.push('Amount from cannot be greater than amount to');
    }

    // Validate date range
    if (filters.startDate && filters.endDate) {
      const fromDate =
        typeof filters.startDate === 'string'
          ? new Date(filters.startDate)
          : filters.startDate;
      const toDate =
        typeof filters.endDate === 'string'
          ? new Date(filters.endDate)
          : filters.endDate;

      if (fromDate > toDate) {
        errors.push('Date from cannot be after date to');
      }
    }

    // Validate date formats
    if (filters.startDate) {
      const date =
        typeof filters.startDate === 'string'
          ? new Date(filters.startDate)
          : filters.startDate;
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format for startDate');
      }
    }

    if (filters.endDate) {
      const date =
        typeof filters.endDate === 'string'
          ? new Date(filters.endDate)
          : filters.endDate;
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format for endDate');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export class OrderFilterUtil extends AmountDateValidation {
  /**
   * Builds a MongoDB filter query from the provided filter parameters
   * @param filters - The filter parameters
   * @returns MongoDB filter query object
   */
  static buildFilterQuery(filters: OrderFilterParams): FilterQuery<Order> {
    const query: FilterQuery<Order> = {};

    // Amount filtering (totalPrice)
    if (filters.amountFrom !== undefined || filters.amountTo !== undefined) {
      query.totalPrice = {};

      if (filters.amountFrom !== undefined) {
        query.totalPrice.$gte = filters.amountFrom;
      }

      if (filters.amountTo !== undefined) {
        query.totalPrice.$lte = filters.amountTo;
      }
    }

    if (filters.reference) {
      query.reference = {
        $regex: new RegExp(escapeRegex(filters.reference), 'i'),
      };
    }

    // Customer filtering
    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    // Payment method filtering
    if (filters.paymentMethod) {
      if (Array.isArray(filters.paymentMethod)) {
        query.paymentMethod = { $in: filters.paymentMethod };
      } else {
        query.paymentMethod = filters.paymentMethod;
      }
    }

    // Status filtering
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }

    // Status filtering
    if (filters.paymentStatus) {
      if (Array.isArray(filters.paymentStatus)) {
        query.paymentStatus = { $in: filters.paymentStatus };
      } else {
        query.paymentStatus = filters.paymentStatus;
      }
    }

    // Date range filtering (createdAt)
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};

      if (filters.startDate) {
        const fromDate =
          typeof filters.startDate === 'string'
            ? new Date(filters.startDate)
            : filters.startDate;
        query.createdAt.$gte = fromDate;
      }

      if (filters.endDate) {
        const toDate =
          typeof filters.endDate === 'string'
            ? new Date(filters.endDate)
            : filters.endDate;
        // Set to end of day if only date is provided
        if (
          typeof filters.endDate === 'string' &&
          !filters.endDate.includes('T')
        ) {
          toDate.setHours(23, 59, 59, 999);
        }
        query.createdAt.$lte = toDate;
      }
    }

    // Business filtering
    if (filters.business) {
      query.business = filters.business;
    }

    // Branch filtering
    if (filters.branch) {
      query.branch = filters.branch;
    }

    return query;
  }

  /**
   * Creates a filter for specific payment methods
   * @param methods - Payment methods to filter by
   * @returns Payment method filter
   */
  static createPaymentMethodFilter(methods: string[]): {
    paymentMethod: { $in: string[] };
  } {
    return { paymentMethod: { $in: methods } };
  }

  /**
   * Creates a filter for orders within a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Date range filter
   */
  static createDateRangeFilter(
    startDate: Date | string,
    endDate: Date | string,
  ): { createdAt: { $gte: Date; $lte: Date } } {
    const start =
      typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    // Set end date to end of day if no time specified
    if (typeof endDate === 'string' && !endDate.includes('T')) {
      end.setHours(23, 59, 59, 999);
    }

    return {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
  }

  /**
   * Creates a filter for orders within an amount range
   * @param minAmount - Minimum amount
   * @param maxAmount - Maximum amount
   * @returns Amount range filter
   */
  static createAmountRangeFilter(
    minAmount?: number,
    maxAmount?: number,
  ): { totalPrice: any } | any {
    if (minAmount === undefined && maxAmount === undefined) {
      return {};
    }

    const filter: any = {};

    if (minAmount !== undefined) {
      filter.$gte = minAmount;
    }

    if (maxAmount !== undefined) {
      filter.$lte = maxAmount;
    }

    return { totalPrice: filter };
  }
}

export class ProductFilterUtil extends AmountDateValidation {
  static resolveCategoryFilterValue(
    value: string,
  ): mongoose.Types.ObjectId | string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const objectId = new mongoose.Types.ObjectId(trimmed);
      if (String(objectId) === trimmed) {
        return objectId;
      }
    } catch {
      // Legacy rows may filter by stored category name string.
    }

    return trimmed;
  }

  /**
   * Builds a MongoDB filter query from the provided filter parameters
   * @param filters - The filter parameters
   * @returns MongoDB filter query object
   */
  static buildFilterQuery(filters: OrderFilterParams): FilterQuery<Order> {
    const query: FilterQuery<Order> = {};

    // Amount filtering (totalPrice)
    const stringToNumber = (value: string | number): number => {
      if (typeof value === 'number') return value;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    if (filters.amountFrom !== undefined || filters.amountTo !== undefined) {
      query.discountPrice = {};

      if (filters.amountFrom !== undefined) {
        const amountFrom = stringToNumber(filters.amountFrom);
        query.discountPrice.$gte = amountFrom;
      }

      if (filters.amountTo !== undefined) {
        const amountTo = stringToNumber(filters.amountTo);
        query.discountPrice.$lte = amountTo; // Fixed: was using amountFrom
      }
    }

    if (filters.name) {
      query.name = {
        $regex: new RegExp(escapeRegex(filters.name), 'i'),
      };
    }

    // Customer filtering
    if (filters.customerId) {
      query.customerId = filters.customerId;
    }

    // Track quantity filtering
    if (typeof filters.trackQuantity === 'boolean') {
      query.trackQuantity = filters.trackQuantity;
    } else if (typeof filters.trackQuantity === 'string') {
      query.trackQuantity = filters.trackQuantity === 'true';
    }

    // Convert filters product status to an array of booleans
    // Convert filters.productStatus to an array of booleans
    if (filters.productStatus) {
      query.active = buildBooleanQuery(filters.productStatus);
    }

    // Payment method filtering
    if (filters.paymentMethod) {
      if (Array.isArray(filters.paymentMethod)) {
        query.paymentMethod = { $in: filters.paymentMethod };
      } else {
        query.paymentMethod = filters.paymentMethod;
      }
    }

    if (filters.category) {
      const values = Array.isArray(filters.category)
        ? filters.category
        : [filters.category];
      const resolved = values
        .map((value) => ProductFilterUtil.resolveCategoryFilterValue(String(value)))
        .filter((value): value is mongoose.Types.ObjectId | string => value !== null);

      if (resolved.length === 1) {
        query.category = resolved[0];
      } else if (resolved.length > 1) {
        query.category = { $in: resolved };
      }
    }

    // Status filtering
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }

    const stringToBoolean = (value: string | boolean): boolean => {
      if (typeof value === 'boolean') return value;
      return value.toLowerCase() === 'true';
    };

    if (filters.inStock !== undefined) {
      if (Array.isArray(filters.inStock)) {
        query.inStock = { $in: filters.inStock.map(stringToBoolean) };
      } else {
        query.inStock = stringToBoolean(filters.inStock);
      }
    }

    // Status filtering
    if (filters.paymentStatus) {
      if (Array.isArray(filters.paymentStatus)) {
        query.paymentStatus = { $in: filters.paymentStatus };
      } else {
        query.paymentStatus = filters.paymentStatus;
      }
    }

    // Date range filtering (createdAt)
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};

      if (filters.startDate) {
        const fromDate =
          typeof filters.startDate === 'string'
            ? new Date(filters.startDate)
            : filters.startDate;
        query.createdAt.$gte = fromDate;
      }

      if (filters.endDate) {
        const toDate =
          typeof filters.endDate === 'string'
            ? new Date(filters.endDate)
            : filters.endDate;
        // Set to end of day if only date is provided
        if (
          typeof filters.endDate === 'string' &&
          !filters.endDate.includes('T')
        ) {
          toDate.setHours(23, 59, 59, 999);
        }
        query.createdAt.$lte = toDate;
      }
    }

    // Business filtering
    if (filters.business) {
      query.business = filters.business;
    }

    // Branch filtering
    if (filters.branch) {
      query.branch = filters.branch;
    }

    return query;
  }

  /**
   * Creates a filter for specific payment methods
   * @param methods - Payment methods to filter by
   * @returns Payment method filter
   */
  static createPaymentMethodFilter(methods: string[]): {
    paymentMethod: { $in: string[] };
  } {
    return { paymentMethod: { $in: methods } };
  }

  /**
   * Creates a filter for orders within a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Date range filter
   */
  static createDateRangeFilter(
    startDate: Date | string,
    endDate: Date | string,
  ): { createdAt: { $gte: Date; $lte: Date } } {
    const start =
      typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    // Set end date to end of day if no time specified
    if (typeof endDate === 'string' && !endDate.includes('T')) {
      end.setHours(23, 59, 59, 999);
    }

    return {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
  }

  /**
   * Creates a filter for orders within an amount range
   * @param minAmount - Minimum amount
   * @param maxAmount - Maximum amount
   * @returns Amount range filter
   */
  static createAmountRangeFilter(
    minAmount?: number,
    maxAmount?: number,
  ): { totalPrice: any } | any {
    if (minAmount === undefined && maxAmount === undefined) {
      return {};
    }

    const filter: any = {};

    if (minAmount !== undefined) {
      filter.$gte = minAmount;
    }

    if (maxAmount !== undefined) {
      filter.$lte = maxAmount;
    }

    return { totalPrice: filter };
  }
}

export class WalletTransactionFilterUtil extends AmountDateValidation {
  static buildFilterQuery(
    filters: TransactionFiterParams,
  ): FilterQuery<WalletTransaction> {
    const query: FilterQuery<WalletTransaction> = {};

    // Amount filtering
    if (filters.amountFrom || filters.amountTo) {
      query.amount = {
        ...(filters.amountFrom ? { $gte: filters.amountFrom } : {}),
        ...(filters.amountTo ? { $lte: filters.amountTo } : {}),
      };
    }

    // filter reference by searching
    if (filters.name) {
      query.reference = { $regex: filters.name, $options: 'i' };
    }

    // Date range filtering (createdAt)
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};

      if (filters.startDate) {
        const fromDate =
          typeof filters.startDate === 'string'
            ? new Date(filters.startDate)
            : filters.startDate;
        query.createdAt.$gte = fromDate;
      }

      if (filters.endDate) {
        const toDate =
          typeof filters.endDate === 'string'
            ? new Date(filters.endDate)
            : filters.endDate;
        // Set to end of day if only date is provided
        if (
          typeof filters.endDate === 'string' &&
          !filters.endDate.includes('T')
        ) {
          toDate.setHours(23, 59, 59, 999);
        }
        query.createdAt.$lte = toDate;
      }
    }

    // Status filtering
    if (filters.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status;
    }

    return query;
  }
}

export class CustomerFilterUtil extends AmountDateValidation {
  static buildFilterQuery(
    filters: CustomerFiterParams,
  ): FilterQuery<BusinessCustomer> {
    const query: FilterQuery<BusinessCustomer> = {};

    if (filters.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { businessName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.accountType) {
      query.accountType = Array.isArray(filters.accountType)
        ? { $in: filters.accountType }
        : filters.accountType;
    }

    if (filters.customerStatus) {
      query.active = buildBooleanQuery(filters.customerStatus);
    }

    if (filters.useCredit) {
      query.canBuyOnCredit = buildBooleanQuery(filters.useCredit);
    }

    // Amount filtering
    if (filters.amountFrom || filters.amountTo) {
      query.amount = {
        ...(filters.amountFrom ? { $gte: filters.amountFrom } : {}),
        ...(filters.amountTo ? { $lte: filters.amountTo } : {}),
      };
    }

    // Date range filtering (createdAt)
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};

      if (filters.startDate) {
        const fromDate =
          typeof filters.startDate === 'string'
            ? new Date(filters.startDate)
            : filters.startDate;
        query.createdAt.$gte = fromDate;
      }

      if (filters.endDate) {
        const toDate =
          typeof filters.endDate === 'string'
            ? new Date(filters.endDate)
            : filters.endDate;
        // Set to end of day if only date is provided
        if (
          typeof filters.endDate === 'string' &&
          !filters.endDate.includes('T')
        ) {
          toDate.setHours(23, 59, 59, 999);
        }
        query.createdAt.$lte = toDate;
      }
    }

    return query;
  }
}

// Usage examples and helper functions

/**
 * Example usage of the filter utility
 */
export const OrderFilterExamples = {
  // Filter by amount range
  byAmountRange: (from: number, to: number) =>
    OrderFilterUtil.buildFilterQuery({ amountFrom: from, amountTo: to }),

  // Filter by customer
  byCustomer: (customerId: string) =>
    OrderFilterUtil.buildFilterQuery({ customerId }),

  // Filter by multiple payment methods
  byPaymentMethods: (methods: string[]) =>
    OrderFilterUtil.buildFilterQuery({ paymentMethod: methods }),

  // Filter by status
  byStatus: (status: ORDER_STATUS) =>
    OrderFilterUtil.buildFilterQuery({ status }),

  // Filter by date range
  byDateRange: (from: string, to: string) =>
    OrderFilterUtil.buildFilterQuery({ startDate: from, endDate: to }),

  // Complex filter combining multiple criteria
  complexFilter: (filters: OrderFilterParams) =>
    OrderFilterUtil.buildFilterQuery(filters),
};

// Common payment method constants
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CREDIT: 'credit',
  WALLET: 'wallet',
} as const;

// Type for payment methods
export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
