import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Payment id is required' });
  }

  const body = (await readBody(event)) as Record<string, unknown>;

  return patchAdminLegacyApi(event, `/admin/credit/payments/${id}/confirm-transfer`, body, {
    fallbackMessage: 'Unable to confirm bank transfer',
  });
});
