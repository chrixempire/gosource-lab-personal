/** Extract Paystack payment reference from Inline JS v2 success payload shapes. */
export function extractPaystackPaymentReference(event: unknown): string {
  if (typeof event === 'string') {
    return event.trim();
  }

  if (!event || typeof event !== 'object') {
    return '';
  }

  const record = event as Record<string, unknown>;
  const topLevel = record.reference;
  if (typeof topLevel === 'string' && topLevel.trim()) {
    return topLevel.trim();
  }

  const transaction = record.transaction;
  if (transaction && typeof transaction === 'object') {
    const nested = (transaction as Record<string, unknown>).reference;
    if (typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }

  const data = record.data;
  if (data && typeof data === 'object') {
    const dataRef = (data as Record<string, unknown>).reference;
    if (typeof dataRef === 'string' && dataRef.trim()) {
      return dataRef.trim();
    }
  }

  return '';
}
