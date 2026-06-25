import { createError, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ orderId?: string; products?: unknown[] }>(event);

  if (!body?.orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order id is required' });
  }

  if (!Array.isArray(body.products) || body.products.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one product is required',
    });
  }

  return patchAdminLegacyApi(
    event,
    '/admin/order/add-products',
    {
      orderId: body.orderId,
      products: body.products,
    },
    {
      fallbackMessage: 'Unable to add items to order',
    },
  );
});
