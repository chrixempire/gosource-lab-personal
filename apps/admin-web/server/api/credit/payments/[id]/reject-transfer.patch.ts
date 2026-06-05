import { createError, getRouterParam } from 'h3';
import { patchAdminLegacyApi } from '../../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Payment id is required' });
  }

  return patchAdminLegacyApi(event, `/admin/credit/payments/${id}/reject-transfer`, {}, {
    fallbackMessage: 'Unable to reject bank transfer',
  });
});
