import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function unwrapPayload(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }

  return asRecord(root.data) ?? root;
}

async function fetchCustomerTotal(
  event: Parameters<typeof fetchAdminLegacyApi>[0],
  customerStatus: 'true' | 'false',
) {
  const response = await fetchAdminLegacyApi<{ meta?: { totalDocuments?: number } }>(
    event,
    '/admin/customer',
    {
      query: { customerStatus, limit: 1, page: 1 },
      fallbackMessage: 'Unable to load customer count',
    },
  );

  return response.meta?.totalDocuments ?? 0;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const filterQuery = {
    filterType: query.filterType as string | undefined,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
  };

  const [metricsResult, activeResult, inactiveResult] = await Promise.allSettled([
    fetchAdminLegacyApi(event, '/admin/order/dashboard-metrics', {
      query: filterQuery,
      fallbackMessage: 'Unable to load order summary',
    }),
    fetchCustomerTotal(event, 'true'),
    fetchCustomerTotal(event, 'false'),
  ]);

  const metricsBody =
    metricsResult.status === 'fulfilled' ? unwrapPayload(metricsResult.value) : null;
  const trends = asRecord(metricsBody?.trends);
  const summary = asRecord(trends?.summary);

  return {
    orders: Number(summary?.orderCount) || 0,
    totalOrdersAmount: Number(summary?.totalValue) || 0,
    activeCustomers: activeResult.status === 'fulfilled' ? activeResult.value : 0,
    inactiveCustomers: inactiveResult.status === 'fulfilled' ? inactiveResult.value : 0,
    permissions: {
      orders: metricsResult.status === 'fulfilled',
      activeCustomers: activeResult.status === 'fulfilled',
      inactiveCustomers: inactiveResult.status === 'fulfilled',
    },
  };
});
