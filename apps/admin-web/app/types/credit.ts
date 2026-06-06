import type { InventoryTableMeta } from '~/types/inventory';

export type CreditWorkflowStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'defaulted';

export type CreditApplicationType = 'initial' | 'increase';

export type CreditRequestType = 'initial' | 'topup';

export type CreditPaymentStatus =
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type LegacyCreditBusiness = {
  _id?: string;
  id?: string;
  accountType?: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  createdAt?: string;
};

export type LegacyCreditTimelineEntry = {
  status?: string;
  note?: string;
  changedAt?: string;
  changedBy?: { firstName?: string; lastName?: string };
};

export type CreditAdditionalDoc = {
  key: string;
  url: string;
};

export type CreditChecklistItem = {
  name: string;
  verified: boolean;
};

export type CreditInternalNote = {
  id: string;
  note: string;
  noteType: string;
  createdAt: string;
  authorName: string;
};

export type CreditTopPerformerRow = {
  businessId: string;
  displayName: string;
  accountType: string;
  creditLimitKobo: number;
  creditUsedKobo: number;
  repaymentScore: number;
  status: 'active' | 'inactive';
};

export type LegacyCreditApplicationRow = {
  _id?: string;
  id?: string;
  createdAt?: string;
  status?: CreditWorkflowStatus;
  applicationType?: CreditApplicationType;
  business?: LegacyCreditBusiness;
  rejectionReason?: string;
  approvedAmountKobo?: number;
  requestedAmountKobo?: number;
  timeline?: LegacyCreditTimelineEntry[];
  cacRegistrationNumber?: string;
  tin?: string;
  bvn?: string;
  revenueRange?: string;
  yearOfOperations?: string;
  identityType?: string;
  identity?: string;
  currentCreditAccount?: {
    limitKobo?: number;
    outstandingKobo?: number;
    creditUtilization?: number;
  };
  bankStatement?: string;
  additionalDocs?: CreditAdditionalDoc[];
};

export type RepaymentScheduleStatus =
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'PARTIALLY_PAID'
  | 'CANCELLED';

export type CreditRepaymentScheduleItem = {
  id: string;
  installmentNumber: number;
  dueDateLabel: string;
  amountDueLabel: string;
  overdueChargesLabel: string | null;
  status: RepaymentScheduleStatus;
  statusLabel: string;
  referenceLabel: string;
};

export type CustomerOrdersSummary = {
  totalOrders: number;
  avgMonthlySpend: number;
  lastOrder: string | null;
  totalSpent: number;
};

export type AdminCreditApplicationListItem = {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  reference: string;
  displayName: string;
  businessId: string;
  accountType: string;
  applicationType: CreditApplicationType;
  applicationTypeLabel: string;
  status: CreditWorkflowStatus;
  statusLabel: string;
};

export type LegacyCreditRequestRow = {
  _id?: string;
  id?: string;
  createdAt?: string;
  status?: CreditWorkflowStatus;
  requestType?: CreditRequestType;
  requestedAmountKobo?: number;
  approvedAmountKobo?: number;
  business?: LegacyCreditBusiness;
  creditAccount?: { limitKobo?: number; outstandingKobo?: number };
  application?: LegacyCreditApplicationRow;
  timeline?: LegacyCreditTimelineEntry[];
  repaymentFrequency?: string;
  repaymentDuration?: number;
  interestRate?: number;
  gracePeriodDays?: number;
  overdueChargeRate?: number;
  totalInterestAmountKobo?: number;
  totalRepaymentAmountKobo?: number;
  rejectionReason?: string;
};

export type AdminCreditRequestListItem = {
  id: string;
  reference: string;
  createdAt: string;
  createdAtLabel: string;
  displayName: string;
  businessId: string;
  accountType: string;
  requestType: CreditRequestType;
  requestTypeLabel: string;
  requestedAmountKobo: number;
  creditLimitKobo: number;
  status: CreditWorkflowStatus;
  statusLabel: string;
};

export type CreditRequestStats = {
  totalRequests: number;
  totalPendingRequests: number;
  totalApprovedRequests: number;
  totalRejectedRequests: number;
  totalCreditInUseKobo: number;
  totalOverdueAccounts: number;
};

export type LegacyRepaymentPaymentRow = {
  _id?: string;
  referenceCode?: string;
  createdAt?: string;
  amountKobo?: number;
  paymentMethod?: string;
  status?: CreditPaymentStatus;
  business?: {
    _id?: string;
    id?: string;
    businessName?: string;
    firstName?: string;
    lastName?: string;
    accountType?: string;
  };
};

export type AdminRepaymentListItem = {
  id: string;
  businessId: string;
  referenceCode: string;
  businessName: string;
  paymentDate: string;
  paymentDateLabel: string;
  amountKobo: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  status: CreditPaymentStatus;
};

export type RepaymentListSummary = {
  totalCreditDisbursedKobo: number;
  totalPaidRepaymentsKobo: number;
  outstandingRepaymentsKobo: number;
  overduePaymentsCount: number;
  dueThisWeekCount: number;
  dueThisMonthCount: number;
};

export type CreditApplicationListFilters = {
  page: number;
  limit: number;
  search: string;
  applicationType: CreditApplicationType[];
  status: CreditWorkflowStatus[];
  startDate: string;
  endDate: string;
};

export type CreditRequestListFilters = {
  page: number;
  limit: number;
  search: string;
  requestType: CreditRequestType[];
  status: CreditWorkflowStatus[];
  startDate: string;
  endDate: string;
};

export type CreditRepaymentListFilters = {
  page: number;
  limit: number;
  search: string;
  businessIds: string[];
  paymentMethod: string[];
  startDate: string;
  endDate: string;
};

export type CreditScheduleListFilters = {
  page: number;
  limit: number;
  search: string;
  status: RepaymentScheduleStatus[];
  startDate: string;
  endDate: string;
};

export type AdminRepaymentScheduleListItem = {
  id: string;
  businessId: string;
  creditRequestId: string;
  displayName: string;
  installmentNumber: number;
  dueDateLabel: string;
  amountDueLabel: string;
  remainingAmountLabel: string;
  status: RepaymentScheduleStatus;
  statusLabel: string;
  daysOverdue: number | null;
  referenceLabel: string;
};

export type RepaymentSchedulesSummary = {
  totalRepayments: number;
  totalScheduledAmountKobo: number;
  totalPaidAmountKobo: number;
  totalRemainingAmountKobo: number;
  totalOverdueAmountKobo: number;
  overdueCount: number;
  collectionRate: number;
};

export type OverdueRepaymentSummary = {
  totalOverdueAmountKobo: number;
  totalOverdueCount: number;
  averageDaysOverdue: number;
};

export type ParsedCreditList<T> = {
  rows: T[];
  meta: InventoryTableMeta;
};
