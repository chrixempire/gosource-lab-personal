import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  const response = await fetchAdminLegacyApi<{
    topBestSellers?: unknown[];
    meta?: Record<string, unknown>;
    data?: {
      topBestSellers?: unknown[];
      meta?: Record<string, unknown>;
    };
  }>(event, '/admin/product/best-selling-items', {
    query: {
      filterType: query.filterType as string | undefined,
      startDate: query.startDate as string | undefined,
      endDate: query.endDate as string | undefined,
      sortOrder: query.sortOrder as string | undefined,
      page,
      limit,
    },
    fallbackMessage: 'Unable to load best selling products',
  });

  const topBestSellers = response.topBestSellers ?? response.data?.topBestSellers ?? [];
  const meta = response.meta ?? response.data?.meta;

  return {
    topBestSellers,
    meta,
  };
});
