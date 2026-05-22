import type { WalletTransactionRecord } from '@gosource/api-client';
import { formatRequestCurrency } from '~/lib/request-details';

export function walletTransactionTypeIndicatorClass(type: WalletTransactionRecord['type']) {
  return type === 'credit' ? 'bg-primary-500' : 'bg-negative-500';
}

export function walletTransactionStatusVariant(
  status: WalletTransactionRecord['status'],
): 'success' | 'negative' | 'warning' {
  if (status === 'successful') {
    return 'success';
  }
  if (status === 'cancelled') {
    return 'negative';
  }
  return 'warning';
}

export function formatWalletTransactionAmount(row: WalletTransactionRecord) {
  const prefix = row.type === 'credit' ? '+' : '-';
  return `${prefix}${formatRequestCurrency(row.amount)}`;
}

export function formatWalletTransactionDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

export function transactionMatchesReferenceSearch(
  row: WalletTransactionRecord,
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [row.reference, row.paymentReference, row.description].some((field) =>
    field.toLowerCase().includes(normalized),
  );
}
