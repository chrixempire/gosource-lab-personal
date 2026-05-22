import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const response = await fetchAdminLegacyApi<{
    status?: boolean;
    data?: {
      trends?: unknown;
      statusBreakdown?: unknown;
      dateRange?: unknown;
    };
    trends?: unknown;
    statusBreakdown?: unknown;
    dateRange?: unknown;
  }>(event, '/admin/order/dashboard-metrics', {
    query: {
      filterType: query.filterType as string | undefined,
      startDate: query.startDate as string | undefined,
      endDate: query.endDate as string | undefined,
    },
    fallbackMessage: 'Unable to load order dashboard metrics',
  });

  const payload = response.data ?? response;

  return {
    trends: payload.trends,
    statusBreakdown: payload.statusBreakdown,
    dateRange: payload.dateRange,
  };
});
