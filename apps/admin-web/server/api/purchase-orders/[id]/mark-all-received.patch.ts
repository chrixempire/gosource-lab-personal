import { createError, getRouterParam } from 'h3';
import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase order id is required' });
  }

  return patchAdminLegacyApi(event, `/admin/purchase-order/${id}/mark-all-received`, {}, {
    fallbackMessage: 'Unable to mark all items as received',
  });
});
