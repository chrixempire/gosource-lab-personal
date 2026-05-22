import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';
import { readLegacyQueryArray, readLegacyQueryValue } from '../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  return fetchAdminLegacyApi(event, '/admin/promotion', {
    query: {
      page,
      limit,
      name: readLegacyQueryValue(query, 'name'),
      startDate: readLegacyQueryValue(query, 'startDate'),
      endDate: readLegacyQueryValue(query, 'endDate'),
      status: readLegacyQueryArray(query, 'status'),
    },
    fallbackMessage: 'Unable to load promotions',
  });
});
