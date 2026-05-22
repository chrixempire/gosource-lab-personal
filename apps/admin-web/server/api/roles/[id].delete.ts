import { deleteAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  return deleteAdminLegacyApi(event, `/admin/role/${id}`, {}, {
    fallbackMessage: 'Unable to delete role',
  });
});
