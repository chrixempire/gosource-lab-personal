import { readLegacyQueryValue } from './legacy-query';

export function readCreditPaginationQuery(query: Record<string, unknown>) {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    sortBy: readLegacyQueryValue(query, 'sortBy') ?? 'createdAt',
    sortOrder: readLegacyQueryValue(query, 'sortOrder') ?? 'desc',
    filterBy: readLegacyQueryValue(query, 'filterBy'),
    filterValue: readLegacyQueryValue(query, 'filterValue'),
    startDate: readLegacyQueryValue(query, 'startDate'),
    endDate: readLegacyQueryValue(query, 'endDate'),
    search: readLegacyQueryValue(query, 'search'),
    status: readLegacyQueryValue(query, 'status'),
    businessId: readLegacyQueryValue(query, 'businessId'),
    paymentMethod: readLegacyQueryValue(query, 'paymentMethod'),
    fromDate: readLegacyQueryValue(query, 'fromDate'),
    toDate: readLegacyQueryValue(query, 'toDate'),
  };
}
