import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';
import { readLegacyQueryValue } from '../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 50;

  return fetchAdminLegacyApi(event, '/admin/admin/search', {
    query: {
      page,
      limit,
      name: readLegacyQueryValue(query, 'name'),
    },
    fallbackMessage: 'Unable to search admin users',
  });
});
