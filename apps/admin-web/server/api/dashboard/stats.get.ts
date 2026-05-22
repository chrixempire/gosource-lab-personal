import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  return fetchAdminLegacyApi(event, '/admin/admin/stats', {
    fallbackMessage: 'Unable to load dashboard stats',
  });
});
