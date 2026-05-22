import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';
import { readLegacyQueryArray, readLegacyQueryValue } from '../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  return fetchAdminLegacyApi(event, '/admin/customer', {
    query: {
      page,
      limit,
      search: readLegacyQueryValue(query, 'search'),
      startDate: readLegacyQueryValue(query, 'startDate'),
      endDate: readLegacyQueryValue(query, 'endDate'),
      amountFrom: query.amountFrom != null ? Number(query.amountFrom) : undefined,
      amountTo: query.amountTo != null ? Number(query.amountTo) : undefined,
      accountType: readLegacyQueryArray(query, 'accountType'),
      customerStatus: readLegacyQueryValue(query, 'customerStatus'),
      useCredit: readLegacyQueryValue(query, 'useCredit'),
    },
    fallbackMessage: 'Unable to load customers',
  });
});
