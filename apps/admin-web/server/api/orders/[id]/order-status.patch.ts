import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody<{ status?: string }>(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order id is required' });
  }

  if (!body?.status) {
    throw createError({ statusCode: 400, statusMessage: 'Status is required' });
  }

  return patchAdminLegacyApi(event, `/admin/order/${id}/update-order-status`, {
    status: body.status,
  }, {
    fallbackMessage: 'Unable to update order status',
  });
});
