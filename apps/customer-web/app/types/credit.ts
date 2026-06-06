export type CreditWorkflowStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'defaulted';

export type CreditApplicationType = 'initial' | 'increase';

export type CreditRequestType = 'initial' | 'topup';

export type CreditListMeta = {
  page: number;
  limit: number;
  total: number;
};

export type CustomerCreditApplication = {
  id: string;
  createdAt: string;
  status: CreditWorkflowStatus;
  applicationType: CreditApplicationType;
  requestedAmountKobo: number;
  approvedAmountKobo: number;
  rejectionReason: string;
};

export type CustomerCreditApplicationsResult = {
  items: CustomerCreditApplication[];
  meta: CreditListMeta;
};

export type CustomerCreditAccount = {
  id: string;
  limitKobo: number;
  outstandingKobo: number;
  spendableAmountKobo: number;
  availableKobo: number;
  totalPaymentsKobo: number;
  totalOverdueKobo: number;
  creditUtilization: number;
  status: string;
};

export type CustomerCreditRequest = {
  id: string;
  createdAt: string;
  status: CreditWorkflowStatus;
  requestType: CreditRequestType;
  requestedAmountKobo: number;
  repaidAmountKobo: number;
  reference: string;
  requestedRepaymentFrequency?: string;
  requestedRepaymentDuration?: number;
};

export type CustomerCreditRequestsResult = {
  items: CustomerCreditRequest[];
  meta: CreditListMeta;
};

export type CustomerCreditRepayment = {
  id: string;
  createdAt: string;
  referenceCode: string;
  paymentAmountKobo: number;
  paymentMethod: string;
  status: string;
};

export type CustomerCreditRepaymentHistoryResult = {
  items: CustomerCreditRepayment[];
  meta: CreditListMeta;
};

export type CustomerUpcomingCreditPayment = {
  totalNextPaymentKobo: number;
  principalAmountKobo: number;
  interestAmountKobo: number;
  nextDueDate: string | null;
  overdueCount: number;
  totalOverdueKobo: number;
} | null;

export type CreditPaymentMethod = 'WALLET' | 'BANK_TRANSFER' | 'CARD';

export type CustomerCreditRepaymentSchedule = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  principalAmountKobo: number;
  interestAmountKobo: number;
  totalAmountKobo: number;
  paidAmountKobo: number;
  remainingAmountKobo: number;
  status: string;
};

export type CustomerCreditRequestDetail = {
  id: string;
  createdAt: string;
  status: CreditWorkflowStatus;
  requestType: CreditRequestType;
  requestedAmountKobo: number;
  approvedAmountKobo: number;
  repaidAmountKobo: number;
  reference: string;
  rejectionReason: string;
  requestedRepaymentFrequency?: string;
  requestedRepaymentDuration?: number;
  repaymentFrequency?: string;
  repaymentDuration?: number;
  interestRate?: number;
  gracePeriodDays?: number;
  overdueChargeRate?: number;
  totalInterestAmountKobo: number;
  totalRepaymentAmountKobo: number;
  dueDate?: string;
  approvedDate?: string;
  schedules: CustomerCreditRepaymentSchedule[];
};
