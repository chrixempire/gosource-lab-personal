import { createError, getQuery, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';
import { readLegacyQueryValue } from '../../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Customer id is required' });
  }

  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  return fetchAdminLegacyApi(event, `/admin/customer/${id}/orders`, {
    query: {
      page,
      limit,
      reference: readLegacyQueryValue(query, 'reference'),
    },
    fallbackMessage: 'Unable to load customer orders',
  });
});
