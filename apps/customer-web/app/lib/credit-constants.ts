import type { CreditRequestType, CreditWorkflowStatus } from '~/types/credit';

export const CREDIT_WORKFLOW_STATUS_LABELS: Record<CreditWorkflowStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Repaid',
  cancelled: 'Cancelled',
  defaulted: 'Defaulted',
};

function normalizeCreditWorkflowStatus(status: string | undefined) {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
}

export function creditWorkflowStatusLabel(status: string) {
  const key = normalizeCreditWorkflowStatus(status);
  return CREDIT_WORKFLOW_STATUS_LABELS[key as CreditWorkflowStatus] ?? status;
}

/** Reference `gosource-web-app` credit history — approved requests show as ongoing. */
export function creditRequestStatusLabel(status: string) {
  const key = normalizeCreditWorkflowStatus(status);
  if (key === 'approved') {
    return 'Ongoing';
  }
  return creditWorkflowStatusLabel(key);
}

/** Reference `gosource-web-app` credit history — rejected and cancelled can reapply. */
export function canReapplyCreditRequest(status: string) {
  const key = normalizeCreditWorkflowStatus(status);
  return key === 'rejected' || key === 'cancelled';
}

export function creditRequestTypeLabel(type: CreditRequestType | string | undefined) {
  const normalized = String(type ?? '').trim().toLowerCase();
  if (normalized === 'initial') {
    return 'New Request';
  }
  if (normalized === 'topup' || normalized === 'top-up') {
    return 'Top Up';
  }
  return type ? String(type) : '—';
}

export function creditWorkflowStatusVariant(
  status: string,
): 'warning' | 'success' | 'negative' | 'default' {
  switch (normalizeCreditWorkflowStatus(status)) {
    case 'approved':
    case 'completed':
      return 'success';
    case 'rejected':
    case 'cancelled':
    case 'defaulted':
      return 'negative';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

/** Status badge variant for credit request history rows (reference app semantics). */
export function creditRequestStatusVariant(
  status: string,
): 'warning' | 'success' | 'negative' | 'default' {
  switch (normalizeCreditWorkflowStatus(status)) {
    case 'approved':
      return 'default';
    case 'completed':
      return 'success';
    case 'rejected':
    case 'cancelled':
    case 'defaulted':
      return 'negative';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}

export const CREDIT_REPAYMENT_FREQUENCY_OPTIONS = [
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
] as const;

export const CREDIT_REPAYMENT_WEEKLY_DURATION_OPTIONS = Array.from({ length: 3 }, (_, index) => {
  const weeks = index + 1;
  return { label: `${weeks} week${weeks > 1 ? 's' : ''}`, value: String(weeks) };
});

export const CREDIT_REPAYMENT_MONTHLY_DURATION_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const months = index + 1;
  return { label: `${months} month${months > 1 ? 's' : ''}`, value: String(months) };
});

/** Reference `gosource-web-app` repayment history payment method column. */
export function creditRepaymentPaymentMethodLabel(method: string | undefined) {
  if (!method) {
    return '—';
  }
  return method.split('_').join(' ');
}

const CREDIT_REPAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PENDING_APPROVAL: 'Pending Approval',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

/** Reference `gosource-web-app` `paymentStatusBadges` labels. */
export function creditRepaymentStatusLabel(status: string) {
  const normalized = status.trim().toUpperCase();
  return CREDIT_REPAYMENT_STATUS_LABELS[normalized] ?? status;
}

export function creditRepaymentStatusVariant(
  status: string,
): 'warning' | 'success' | 'negative' | 'default' {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'COMPLETED') {
    return 'success';
  }
  if (normalized === 'FAILED' || normalized === 'CANCELLED') {
    return 'negative';
  }
  if (normalized === 'PENDING' || normalized === 'PENDING_APPROVAL') {
    return 'warning';
  }
  return 'default';
}

export const CREDIT_PAYMENT_METHOD_OPTIONS = [
  {
    value: 'WALLET' as const,
    label: 'Wallet',
    description: 'Pay from your GoSource wallet balance.',
  },
  {
    value: 'BANK_TRANSFER' as const,
    label: 'Bank transfer',
    description: 'Transfer to our account, then confirm payment.',
  },
  {
    value: 'CARD' as const,
    label: 'Pay online (card)',
    description: 'Pay with debit card or bank via Paystack.',
  },
];

export function creditRepaymentFrequencyLabel(frequency: string | undefined) {
  if (!frequency) {
    return '—';
  }
  if (frequency === 'WEEKLY') {
    return 'Weekly';
  }
  if (frequency === 'MONTHLY') {
    return 'Monthly';
  }
  return frequency;
}

export function creditRepaymentScheduleStatusLabel(status: string) {
  const normalized = status.replace(/_/g, ' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function creditRepaymentScheduleStatusVariant(
  status: string,
): 'warning' | 'success' | 'negative' | 'default' {
  const upper = status.toUpperCase();
  if (upper === 'PAID' || upper === 'COMPLETED') {
    return 'success';
  }
  if (upper === 'OVERDUE') {
    return 'negative';
  }
  if (upper === 'PENDING' || upper === 'PARTIALLY_PAID') {
    return 'warning';
  }
  return 'default';
}

export const CREDIT_REVENUE_RANGE_OPTIONS = [
  { label: 'Below ₦1M', value: 'Below 1M' },
  { label: '₦1M – ₦5M', value: '1M-5M' },
  { label: '₦5M – ₦10M', value: '5M-10M' },
  { label: '₦10M – ₦50M', value: '10M-50M' },
  { label: 'Above ₦50M', value: 'Above 50M' },
] as const;
