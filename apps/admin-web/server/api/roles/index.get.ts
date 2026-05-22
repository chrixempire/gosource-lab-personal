import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  return fetchAdminLegacyApi(event, '/admin/role', {
    fallbackMessage: 'Unable to load roles',
  });
});
