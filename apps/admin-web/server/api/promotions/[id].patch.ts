import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Promotion id is required' });
  }

  const body = await readBody<Record<string, unknown>>(event);
  return patchAdminLegacyApi(event, `/admin/promotion/${id}`, body, {
    fallbackMessage: 'Unable to update promotion',
  });
});
