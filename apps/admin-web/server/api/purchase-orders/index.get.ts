import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';
import { readLegacyQueryArray, readLegacyQueryValue } from '../../utils/legacy-query';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  const response = await fetchAdminLegacyApi(event, '/admin/purchase-order', {
    query: {
      page,
      limit,
      sortBy: readLegacyQueryValue(query, 'sortBy') ?? 'createdAt',
      sortOrder: readLegacyQueryValue(query, 'sortOrder') ?? 'desc',
      filterOperator: readLegacyQueryValue(query, 'filterOperator') ?? 'AND',
      id: readLegacyQueryValue(query, 'id'),
      status: readLegacyQueryArray(query, 'status'),
      productType: readLegacyQueryArray(query, 'productType'),
      startDate: readLegacyQueryValue(query, 'startDate'),
      endDate: readLegacyQueryValue(query, 'endDate'),
      expectedDateFrom: readLegacyQueryValue(query, 'expectedDateFrom'),
      expectedDateTo: readLegacyQueryValue(query, 'expectedDateTo'),
    },
    fallbackMessage: 'Unable to load purchase orders',
  });

  return response;
});
