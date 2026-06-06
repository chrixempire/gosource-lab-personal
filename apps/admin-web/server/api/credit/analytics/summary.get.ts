import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

function unwrapLegacyPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return root;
}

export default defineEventHandler(async (event) => {
  const [paymentHistory, requestStats] = await Promise.all([
    fetchAdminLegacyApi(event, '/admin/credit/payment-history', {
      query: { page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' },
      fallbackMessage: 'Unable to load credit analytics summary',
    }),
    fetchAdminLegacyApi(event, '/admin/credit/requests/stats', {
      fallbackMessage: 'Unable to load credit analytics summary',
    }),
  ]);

  const paymentBody = unwrapLegacyPayload(paymentHistory);
  const statsBody = unwrapLegacyPayload(requestStats);
  const summary = (paymentBody?.summary as Record<string, unknown> | undefined) ?? {};

  return {
    data: {
      totalCreditDisbursedKobo: Number(summary.totalCreditDisbursedKobo) || 0,
      totalCreditOutstandingKobo: Number(summary.outstandingRepaymentsKobo) || 0,
      totalPaidRepaymentsKobo: Number(summary.totalPaidRepaymentsKobo) || 0,
      activeCreditUsers: Number(statsBody?.totalRequests) || 0,
    },
  };
});
