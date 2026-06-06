import type {
  CreditApplicationType,
  CreditPaymentStatus,
  CreditRequestType,
  CreditWorkflowStatus,
} from '~/types/credit';

export const CREDIT_APPLICATION_TYPE_OPTIONS: Array<{
  value: CreditApplicationType;
  label: string;
}> = [
  { value: 'initial', label: 'Credit application' },
  { value: 'increase', label: 'Limit increase' },
];

export const CREDIT_APPLICATION_STATUS_OPTIONS: Array<{
  value: CreditWorkflowStatus;
  label: string;
}> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const CREDIT_REQUEST_TYPE_OPTIONS: Array<{
  value: CreditRequestType;
  label: string;
}> = [
  { value: 'initial', label: 'New request' },
  { value: 'topup', label: 'Top-up request' },
];

export const CREDIT_REQUEST_STATUS_OPTIONS: Array<{
  value: CreditWorkflowStatus;
  label: string;
}> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

export const CREDIT_REPAYMENT_METHOD_FILTER_OPTIONS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'CARD', label: 'Online' },
] as const;

/** Legacy payment method labels (table display). */
export const CREDIT_REPAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank transfer',
  WALLET: 'Wallet',
  CARD: 'Online',
  USSD: 'USSD',
  OTHER: 'Other',
};

export const CREDIT_REPAYMENT_METHOD_OPTIONS = [
  ...CREDIT_REPAYMENT_METHOD_FILTER_OPTIONS,
  { value: 'USSD', label: 'USSD' },
  { value: 'OTHER', label: 'Other' },
];

export const CREDIT_APPLICATION_STAT_CARDS = [
  { key: 'all', label: 'Total applications' },
  { key: 'pending', label: 'Pending review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const;

export const CREDIT_REQUEST_STAT_CARDS = [
  { key: 'all', label: 'Total active accounts' },
  { key: 'pending', label: 'Pending requests' },
  { key: 'approved', label: 'Approved requests' },
  { key: 'rejected', label: 'Rejected requests' },
  { key: 'credit-in-use', label: 'Credit in use' },
  { key: 'overdue', label: 'Overdue accounts' },
] as const;

export const CREDIT_REPAYMENT_STAT_CARDS = [
  { key: 'total-credit', label: 'Total credit disbursed' },
  { key: 'total-repayments', label: 'Total repayments' },
  { key: 'outstanding', label: 'Outstanding repayments' },
  { key: 'overdue', label: 'Overdue payments' },
  { key: 'due-week', label: 'Due this week' },
] as const;

/** Reference `gosource-admin-v2` credit analytics stat cards (trends are mock until API supports deltas). */
export const CREDIT_ANALYTICS_STAT_CARDS = [
  {
    key: 'disbursed',
    label: 'Total credit disbursed',
    trend: { change: '+12%', period: 'MoM', isRise: true },
  },
  {
    key: 'outstanding',
    label: 'Total credit outstanding',
    trend: { change: '-4%', period: 'WoW', isRise: false },
  },
  {
    key: 'active-users',
    label: 'Active credit users',
    trend: { change: '+18%', period: 'This week', isRise: true },
  },
  {
    key: 'interest-revenue',
    label: 'Revenue from interest',
    trend: { change: '+21%', period: 'YoY', isRise: true },
  },
] as const;

export function creditApplicationTypeLabel(type: CreditApplicationType | string | undefined) {
  if (type === 'initial') return 'Credit application';
  if (type === 'increase') return 'Limit increase';
  return type ? String(type) : '—';
}

export function creditRequestTypeLabel(type: CreditRequestType | string | undefined) {
  if (type === 'initial') return 'New request';
  if (type === 'topup') return 'Top-up request';
  return type ? String(type) : '—';
}

export function creditWorkflowStatusLabel(status: CreditWorkflowStatus | string | undefined) {
  if (!status) return '—';
  const map: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Repaid',
    cancelled: 'Cancelled',
    defaulted: 'Defaulted',
  };
  return map[status] ?? status;
}

/** Reference `apps/credit/requests/constant` — approved requests show as ongoing. */
export function creditRequestStatusLabel(status: CreditWorkflowStatus | string | undefined) {
  if (status === 'approved') return 'Ongoing';
  return creditWorkflowStatusLabel(status);
}

export const CREDIT_CUSTOMER_HISTORY_REQUEST_TYPE_OPTIONS = [
  { value: 'new', label: 'New request' },
  { value: 'top-up', label: 'Top-up request' },
] as const;

export const CREDIT_CUSTOMER_HISTORY_TENURE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export const CREDIT_CUSTOMER_HISTORY_STATUS_FILTER_OPTIONS = [
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export function creditStatusVariant(
  status: CreditWorkflowStatus | string | undefined,
): 'warning' | 'success' | 'default' | 'info' | 'negative' {
  if (status === 'pending') return 'warning';
  if (status === 'approved') return 'info';
  if (status === 'completed') return 'success';
  if (status === 'rejected' || status === 'cancelled' || status === 'defaulted') {
    return 'negative';
  }
  return 'default';
}

export function creditPaymentStatusLabel(status: CreditPaymentStatus | string | undefined) {
  if (!status) return '—';
  const normalized = String(status).toUpperCase();
  const map: Record<string, string> = {
    PENDING: 'Pending',
    PENDING_APPROVAL: 'Pending confirmation',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  };
  return map[normalized] ?? status;
}

/** Reference `apps/credit/repayment/constant` paymentStatusBadges */
export function creditPaymentStatusVariant(
  status: CreditPaymentStatus | string | undefined,
): 'warning' | 'success' | 'default' | 'info' | 'negative' {
  const normalized = String(status ?? '').toUpperCase();
  if (normalized === 'PENDING' || normalized === 'PENDING_APPROVAL') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'FAILED' || normalized === 'CANCELLED') return 'negative';
  return 'default';
}

export function creditPaymentMethodLabel(method: string | undefined) {
  if (!method) return '—';
  return CREDIT_REPAYMENT_METHOD_LABELS[method] ?? method;
}

/** Reference `apps/credit/applications/constant` */
export const CREDIT_APPLICATION_REJECTION_REASON_OPTIONS = [
  { label: 'Documents are outdated', value: 'doc-outdated' },
  { label: 'Documents could not be verified', value: 'doc-not-verified' },
  { label: 'Other (add note)', value: 'others' },
];

/** Reference `apps/credit/requests/constant` */
export const CREDIT_REQUEST_REJECTION_REASON_OPTIONS = [
  { label: 'Insufficient transaction volume', value: 'insufficient-transaction-volume' },
  { label: 'Incomplete documentation', value: 'incomplete-document' },
  { label: 'Other (add note)', value: 'others' },
];

/** Reference `ChangeApplicationStatus` modal */
export const CREDIT_REOPEN_APPLICATION_REASON_OPTIONS = [
  { label: 'Updated documents submitted', value: 'Updated documents submitted' },
  { label: 'Additional information received', value: 'Additional information received' },
  { label: 'Initial review error', value: 'Initial review error' },
  { label: 'Manual reassessment required', value: 'Manual reassessment required' },
  { label: 'Other (add note)', value: 'others' },
];

export const CREDIT_WEEKLY_DURATION_OPTIONS = [
  { label: '1 week', value: '1' },
  { label: '2 weeks', value: '2' },
  { label: '3 weeks', value: '3' },
];

export const CREDIT_MONTHLY_DURATION_OPTIONS = [
  { label: '2 months', value: '2' },
  { label: '3 months', value: '3' },
  { label: '4 months', value: '4' },
  { label: '5 months', value: '5' },
  { label: '6 months', value: '6' },
  { label: '12 months', value: '12' },
];

export const CREDIT_DEFAULT_CHECKLIST_ITEMS = [
  'Business information',
  'GoSource order history',
  'KYC documents',
  'Financial summary',
  'Bank statement',
] as const;

import type { RepaymentScheduleStatus } from '~/types/credit';

export const CREDIT_REPAYMENT_SCHEDULE_STATUS: Record<
  RepaymentScheduleStatus,
  { label: string; variant: 'warning' | 'success' | 'default' | 'info' | 'negative' }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'negative' },
  PARTIALLY_PAID: { label: 'Partially paid', variant: 'info' },
  CANCELLED: { label: 'Cancelled', variant: 'negative' },
};

export function creditRepaymentScheduleStatusLabel(status: string | undefined) {
  if (!status) return '—';
  const entry = CREDIT_REPAYMENT_SCHEDULE_STATUS[status as RepaymentScheduleStatus];
  return entry?.label ?? status;
}

export function creditRepaymentScheduleStatusVariant(
  status: string | undefined,
): 'warning' | 'success' | 'default' | 'info' | 'negative' {
  if (!status) return 'default';
  return CREDIT_REPAYMENT_SCHEDULE_STATUS[status as RepaymentScheduleStatus]?.variant ?? 'default';
}

export const CREDIT_SCHEDULE_STATUS_FILTER_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PARTIALLY_PAID', label: 'Partially paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const CREDIT_REPAYMENT_FREQUENCY_OPTIONS = [
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Custom', value: 'CUSTOM' },
];

/** Shared admin credit text links (Button `link` variant + document anchors). */
export const CREDIT_LINK_BUTTON_CLASS =
  '!h-auto shrink-0 !w-fit !px-0 !py-0 !font-semibold !text-primary-600 underline-offset-4 hover:!underline';

export const CREDIT_DOCUMENT_LINK_CLASS =
  'inline-flex items-center gap-1 text-sm font-semibold text-primary-600 underline-offset-4 hover:underline';

/** Circular bordered ellipsis trigger for credit table/card row actions. */
export const CREDIT_TABLE_ACTIONS_TRIGGER_CLASS =
  '!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0';
