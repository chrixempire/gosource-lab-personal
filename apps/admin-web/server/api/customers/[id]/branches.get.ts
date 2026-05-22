import { createError, getQuery, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Customer id is required' });
  }

  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 20;

  return fetchAdminLegacyApi(event, `/admin/customer/${id}/business-branches`, {
    query: { page, limit },
    fallbackMessage: 'Unable to load branches',
  });
});
