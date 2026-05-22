export interface IRepaymentSummary {
  totalRepayments: number;
  totalScheduledAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalOverdueAmount: number;
  overdueCount: number;
  statusBreakdown: Record<string, number>;
  collectionRate: number;
}

export interface IRepaymentResponse {
  repayments: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: IRepaymentSummary;
}

export interface IRepaymentFilters {
  status?: string;
  businessId?: string;
  creditRequestId?: string;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
  isOverdue?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface IPaymentResult {
  success?: boolean;
  totalPaid?: number;
  transactionReference: string;
  paymentStatus?: string;
}
