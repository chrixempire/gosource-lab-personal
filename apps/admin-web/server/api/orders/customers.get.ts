import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 100;

  return fetchAdminLegacyApi(event, '/admin/customer', {
    query: { page, limit },
    fallbackMessage: 'Unable to load customers',
  });
});
