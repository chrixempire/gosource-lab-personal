import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  return patchAdminLegacyApi(event, `/admin/admin/${id}/suspend`, {}, {
    fallbackMessage: 'Unable to suspend admin user',
  });
});
