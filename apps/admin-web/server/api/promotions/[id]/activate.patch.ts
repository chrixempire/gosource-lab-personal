import { createError, getRouterParam } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Promotion id is required' });
  }

  return patchAdminLegacyApi(event, `/admin/promotion/${id}/activate`, {}, {
    fallbackMessage: 'Unable to activate promotion',
  });
});
