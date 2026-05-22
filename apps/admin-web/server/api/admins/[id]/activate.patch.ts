import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  return patchAdminLegacyApi(event, `/admin/admin/${id}/activate`, {}, {
    fallbackMessage: 'Unable to activate admin user',
  });
});
