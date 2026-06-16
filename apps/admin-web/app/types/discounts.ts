export type DiscountRouteSlug =
  | 'amountOffCategory'
  | 'amountOffProduct'
  | 'amountOffOrder'
  | 'freeDelivery';

export type DiscountStatus =
  | 'active'
  | 'inactive'
  | 'expired'
  | 'deactivated'
  | 'used';

export type DiscountListFilters = {
  coupon: string;
  discountType: string[];
  status: DiscountStatus[];
  startDate: string;
  endDate: string;
  expiredDateFrom: string;
  expiredDateTo: string;
  page: number;
  limit: number;
};

export type AdminDiscountListItem = {
  id: string;
  code: string;
  description: string;
  category: string;
  categoryLabel: string;
  type: string;
  typeLabel: string;
  discount: number;
  minimumOrderAmount: number;
  usageLimit: number;
  usageCount: number;
  usagePercent: number;
  status: DiscountStatus;
  statusLabel: string;
  expiryDate: string | null;
  expiryDateLabel: string;
  isActive: boolean;
};

export type DiscountFormValues = {
  code: string;
  discountType: string;
  amount: string;
  categoryId: string;
  productIds: string[];
  minOrderAmount: string;
  usageLimit: string;
  target: string;
  startDate: string;
  startTime: string;
  hasExpiry: boolean;
  endDate: string;
  endTime: string;
};

export type LegacyCouponRow = {
  _id?: string;
  id?: string;
  code?: string;
  type?: string;
  category?: string;
  discount?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  target?: string;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  isActive?: boolean;
  applicableItems?: string[];
  categoryId?: string;
  title?: string;
};
