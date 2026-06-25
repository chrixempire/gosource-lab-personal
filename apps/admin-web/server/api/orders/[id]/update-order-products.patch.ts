import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody<{ products?: unknown[]; reason?: string }>(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order id is required' });
  }

  if (!Array.isArray(body?.products)) {
    throw createError({ statusCode: 400, statusMessage: 'Products are required' });
  }

  return patchAdminLegacyApi(
    event,
    `/admin/order/${id}/update-order-products`,
    {
      products: body.products,
      ...(body.reason ? { reason: body.reason } : {}),
    },
    {
      fallbackMessage: 'Unable to update order items',
    },
  );
});
