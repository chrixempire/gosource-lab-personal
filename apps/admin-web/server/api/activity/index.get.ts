import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

function readQueryValue(query: Record<string, unknown>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry != null && entry !== '')
      .map(String)
      .join(',');
  }
  if (value == null || value === '') {
    return undefined;
  }
  return String(value);
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;

  return fetchAdminLegacyApi(event, '/admin/activity', {
    query: {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      search: readQueryValue(query, 'search'),
      module: readQueryValue(query, 'module'),
      modules: readQueryValue(query, 'modules'),
      action: readQueryValue(query, 'action'),
      initiatorType: readQueryValue(query, 'initiatorType'),
      startDate: readQueryValue(query, 'startDate'),
      endDate: readQueryValue(query, 'endDate'),
      filterOperator: readQueryValue(query, 'filterOperator') ?? 'AND',
    },
    fallbackMessage: 'Unable to load activity logs',
  });
});
