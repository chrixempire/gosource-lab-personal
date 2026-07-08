export type DashboardDateFilterType =
  | 'current_date'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom_range'
  | 'all_time';

export type DashboardDateFilterValue = {
  filterType: DashboardDateFilterType;
  startDate?: string;
  endDate?: string;
};

export type DashboardStatsResponse = {
  status: boolean;
  message: string;
  data: {
    orders: number;
    totalOrdersAmount: number;
    customers: number;
  };
};

export type DashboardUnresolvedCostItem = {
  orderRef: string;
  productName: string;
  unit: string | null;
  quantity: number | null;
  marketPrice: number | null;
  sellingPrice: number | null;
};

export type DashboardSummaryResponse = {
  orders: number;
  totalOrdersAmount: number;
  activeCustomers: number;
  inactiveCustomers: number;
  purchaseOrderSpend: number;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  grossMarginPercent: number;
  historicalProfitCoveragePercent: number;
  unresolvedCostItems: DashboardUnresolvedCostItem[];
  qualifyingRevenueOrderCount: number;
  unverifiedProfitOrderCount: number;
  permissions?: {
    orders?: boolean;
    activeCustomers?: boolean;
    inactiveCustomers?: boolean;
    purchaseOrders?: boolean;
    financials?: boolean;
  };
};

export type DashboardCustomerCountsResponse = {
  active: number;
  inactive: number;
};

export type DashboardTrendPoint = {
  label: string;
  date: string;
  orderCount: number;
  totalValue: number;
};

export type DashboardStatusSlice = {
  status: string;
  count: number;
  percentage: number;
};

export type DashboardOrderMetricsResponse = {
  status: boolean;
  message: string;
  data: {
    trends: {
      points: DashboardTrendPoint[];
      summary: {
        orderCount: number;
        totalValue: number;
      };
    };
    statusBreakdown: {
      total: number;
      slices: DashboardStatusSlice[];
    };
    financials: {
      revenue: number;
      verifiedRevenue: number;
      costOfGoodsSold: number;
      grossProfit: number;
      grossMarginPercent: number;
      historicalCoveragePercent: number;
      unresolvedCostItems?: DashboardUnresolvedCostItem[];
      qualifyingOrderCount: number;
      verifiedProfitOrderCount: number;
      unverifiedProfitOrderCount: number;
    };
    dateRange: DashboardDateFilterValue;
  };
};

export type DashboardBestSeller = {
  _id?: string | Record<string, unknown>;
  product?: {
    _id?: string;
    name?: string;
    actualPrice?: number;
    discountPrice?: number;
    /** v2 selling-price map, e.g. { pieces: 3000, pack: 35000 }. May arrive as JSON string. */
    unit?: Record<string, number> | string;
    /** v2 sale-price map (overrides `unit` when present). May arrive as JSON string. */
    discountedUnit?: Record<string, number> | string;
  };
  /** The unit the product was ordered in, e.g. "pack". */
  soldUnit?: string;
  totalOrders: number;
  totalQuantitySold: number;
  totalRevenue: number;
};

export type DashboardBestSellingResponse = {
  status: boolean;
  data: {
    topBestSellers: DashboardBestSeller[];
  };
};

export type DashboardRankedCustomer = {
  customerId: string;
  businessName?: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
};

export type DashboardCustomerRankingResponse = {
  status: boolean;
  data: {
    customers: DashboardRankedCustomer[];
  };
};

export type DashboardTableMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type DashboardPaginatedBestSellingResponse = {
  topBestSellers: DashboardBestSeller[];
  meta: DashboardTableMeta;
};

export type DashboardPaginatedCustomerRankingResponse = {
  customers: DashboardRankedCustomer[];
  meta: DashboardTableMeta;
};
