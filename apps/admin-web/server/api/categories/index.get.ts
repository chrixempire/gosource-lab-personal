import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

function readQueryValue(query: Record<string, unknown>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] != null ? String(value[0]) : undefined;
  }
  if (value == null || value === '') {
    return undefined;
  }
  return String(value);
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;

  return fetchAdminLegacyApi(event, '/admin/category', {
    query: {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      filterBy: readQueryValue(query, 'filterBy'),
      filterValue: readQueryValue(query, 'filterValue'),
      sortBy: readQueryValue(query, 'sortBy'),
      sortOrder: readQueryValue(query, 'sortOrder'),
    },
    fallbackMessage: 'Unable to load categories',
  });
});
