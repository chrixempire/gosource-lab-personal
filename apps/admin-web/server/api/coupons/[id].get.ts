import { createError, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Discount id is required' });
  }
  return fetchAdminLegacyApi(event, `/admin/coupon/${id}`, {
    fallbackMessage: 'Unable to load discount',
  });
});
