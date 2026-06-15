import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  return fetchAdminLegacyApi(event, '/admin/marketplace-banners', {
    fallbackMessage: 'Unable to load marketplace banners',
  });
});
