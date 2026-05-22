import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody<{ reason?: string }>(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order id is required' });
  }

  if (!body?.reason?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Cancellation reason is required' });
  }

  return patchAdminLegacyApi(event, `/admin/order/${id}/cancel`, {
    reason: body.reason.trim(),
  }, {
    fallbackMessage: 'Unable to cancel order',
  });
});
