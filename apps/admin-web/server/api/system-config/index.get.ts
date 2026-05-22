import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  return fetchAdminLegacyApi(event, '/admin/system-config', {
    fallbackMessage: 'Unable to load system configuration',
  });
});
