import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody<{ cartIds?: string[] }>(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order id is required' });
  }

  if (!Array.isArray(body?.cartIds) || body.cartIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one product is required' });
  }

  return patchAdminLegacyApi(event, `/admin/order/${id}/mark-delivered-products`, {
    cartIds: body.cartIds,
  }, {
    fallbackMessage: 'Unable to mark products as delivered',
  });
});
