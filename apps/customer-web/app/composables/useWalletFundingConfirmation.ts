import type { WalletTransactionsResponse } from '@gosource/api-client';

export type WalletFundingConfirmationResult = 'successful' | 'failed' | 'timeout';

type ListTransactionsFn = (query?: {
  page?: number;
  limit?: number;
}) => Promise<WalletTransactionsResponse>;

export async function waitForWalletFundingConfirmation(options: {
  paymentReference: string;
  listTransactions: ListTransactionsFn;
  intervalMs?: number;
  maxAttempts?: number;
  /** Called after each poll (including the first) so the UI can refresh. */
  onPoll?: () => void | Promise<void>;
}): Promise<WalletFundingConfirmationResult> {
  const {
    paymentReference,
    listTransactions,
    intervalMs = 4_000,
    maxAttempts = 20,
    onPoll,
  } = options;

  const normalizedReference = paymentReference.trim();
  if (!normalizedReference) {
    return 'timeout';
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    try {
      const response = await listTransactions({ page: 1, limit: 25 });
      await onPoll?.();

      const transactions = response.data?.transactions ?? [];
      const match = transactions.find(
        (row) =>
          row.paymentReference.trim() === normalizedReference ||
          row.reference.trim() === normalizedReference,
      );

      if (match?.status === 'successful') {
        return 'successful';
      }

      if (match?.status === 'cancelled') {
        return 'failed';
      }
    } catch {
      // Keep polling until attempts are exhausted.
    }
  }

  return 'timeout';
}
