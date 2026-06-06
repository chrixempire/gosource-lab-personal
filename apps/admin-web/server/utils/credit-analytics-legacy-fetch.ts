import type { H3Event } from 'h3';
import { fetchAdminLegacyApi } from './admin-legacy-proxy';
import { unwrapLegacyPayload } from './legacy-payload';

export const CREDIT_ANALYTICS_PAGE_SIZE = 200;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export async function fetchLegacyCreditList(
  event: H3Event,
  path: string,
  listKey: string,
  maxPages: number,
  fallbackMessage = 'Unable to load credit analytics data',
) {
  const rows: Record<string, unknown>[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchAdminLegacyApi(event, path, {
      query: { page, limit: CREDIT_ANALYTICS_PAGE_SIZE, sortBy: 'createdAt', sortOrder: 'desc' },
      fallbackMessage,
    });
    const body = unwrapLegacyPayload(response);
    const batch = Array.isArray(body?.[listKey])
      ? (body[listKey] as Record<string, unknown>[])
      : [];
    rows.push(...batch);

    const meta = asRecord(body?.meta);
    if (!meta?.hasNextPage) break;
  }

  return rows;
}

export async function fetchLegacyCreditRequests(event: H3Event, maxPages: number) {
  return fetchLegacyCreditList(
    event,
    '/admin/credit/requests',
    'requests',
    maxPages,
    'Unable to load credit requests for analytics',
  );
}

export async function fetchLegacyRepaymentSchedules(event: H3Event, maxPages: number) {
  return fetchLegacyCreditList(
    event,
    '/admin/credit/repayment-schedules',
    'repayments',
    maxPages,
    'Unable to load repayment schedules for analytics',
  );
}

export async function fetchLegacyPaymentHistory(event: H3Event, maxPages: number) {
  return fetchLegacyCreditList(
    event,
    '/admin/credit/payment-history',
    'repayments',
    maxPages,
    'Unable to load payment history for analytics',
  );
}
