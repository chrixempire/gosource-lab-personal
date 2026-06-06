import { createError, getQuery, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';
import { readCreditPaginationQuery } from '../../../utils/credit-list-query';
import { readLegacyQueryArray, readLegacyQueryValue } from '../../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Customer id is required' });
  }

  const query = getQuery(event) as Record<string, unknown>;
  const pagination = readCreditPaginationQuery(query);
  const requestTypes = readLegacyQueryArray(query, 'requestType') ?? [];
  const statuses = readLegacyQueryArray(query, 'status') ?? [];

  return fetchAdminLegacyApi(event, `/admin/customer/${id}/credit-history`, {
    query: {
      page: pagination.page,
      limit: pagination.limit,
      ...(pagination.search ? { search: pagination.search } : {}),
      ...(requestTypes.length > 0 ? { requestType: requestTypes } : {}),
      ...(statuses.length > 0 ? { status: statuses } : {}),
      ...(readLegacyQueryValue(query, 'dateFrom')
        ? { dateFrom: readLegacyQueryValue(query, 'dateFrom') }
        : {}),
      ...(readLegacyQueryValue(query, 'dateTo')
        ? { dateTo: readLegacyQueryValue(query, 'dateTo') }
        : {}),
    },
    fallbackMessage: 'Unable to load customer credit history',
  });
});
