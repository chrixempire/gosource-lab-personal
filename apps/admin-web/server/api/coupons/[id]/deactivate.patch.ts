import { createError, getRouterParam } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Discount id is required' });
  }
  return patchAdminLegacyApi(event, `/admin/coupon/${id}/deactivate`, {}, {
    fallbackMessage: 'Unable to deactivate discount',
  });
});
