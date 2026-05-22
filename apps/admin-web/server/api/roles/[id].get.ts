import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  return fetchAdminLegacyApi(event, `/admin/role/${id}`, {
    fallbackMessage: 'Unable to load role',
  });
});
