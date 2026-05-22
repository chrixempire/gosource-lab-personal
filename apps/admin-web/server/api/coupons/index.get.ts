import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';
import { readLegacyQueryValue } from '../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  return fetchAdminLegacyApi(event, '/admin/coupon', {
    query: {
      page,
      limit,
      sortBy: readLegacyQueryValue(query, 'sortBy') ?? 'createdAt',
      sortOrder: readLegacyQueryValue(query, 'sortOrder') ?? 'desc',
      filterBy: readLegacyQueryValue(query, 'filterBy'),
      filterValue: readLegacyQueryValue(query, 'filterValue'),
      startDate: readLegacyQueryValue(query, 'startDate'),
      endDate: readLegacyQueryValue(query, 'endDate'),
    },
    fallbackMessage: 'Unable to load discounts',
  });
});
