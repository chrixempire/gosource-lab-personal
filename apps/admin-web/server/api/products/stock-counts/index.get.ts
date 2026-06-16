import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 20;

  return fetchAdminLegacyApi(event, '/admin/product/stock-counts', {
    query: { page, limit },
    fallbackMessage: 'Unable to load stock count history',
  });
});
