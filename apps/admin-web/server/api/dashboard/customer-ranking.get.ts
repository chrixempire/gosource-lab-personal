import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  const response = await fetchAdminLegacyApi<{
    status?: boolean;
    data?: {
      customers?: unknown[];
      meta?: Record<string, unknown>;
    };
    customers?: unknown[];
    meta?: Record<string, unknown>;
  }>(event, '/admin/customer/ranking', {
    query: {
      filterType: query.filterType as string | undefined,
      startDate: query.startDate as string | undefined,
      endDate: query.endDate as string | undefined,
      sortOrder: query.sortOrder as string | undefined,
      page,
      limit,
    },
    fallbackMessage: 'Unable to load customer ranking',
  });

  const payload = response.data ?? response;

  return {
    customers: payload.customers ?? [],
    meta: payload.meta,
  };
});
