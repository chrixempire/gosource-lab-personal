import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  return fetchAdminLegacyApi(event, '/admin/admin', {
    fallbackMessage: 'Unable to load admin users',
  });
});
