import type { CreditWorkflowStatus } from '~/types/credit';

export const CREDIT_WORKFLOW_STATUS_LABELS: Record<CreditWorkflowStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
  defaulted: 'Defaulted',
};

export function creditWorkflowStatusLabel(status: string) {
  return CREDIT_WORKFLOW_STATUS_LABELS[status as CreditWorkflowStatus] ?? status;
}

export function creditWorkflowStatusVariant(
  status: string,
): 'warning' | 'success' | 'negative' | 'default' {
  switch (status) {
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
