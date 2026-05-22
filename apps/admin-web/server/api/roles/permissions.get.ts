import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  return fetchAdminLegacyApi(event, '/admin/role/permissions', {
    fallbackMessage: 'Unable to load permissions',
  });
});
