import { createError, getRouterParam } from 'h3';
import { deleteAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase order id is required' });
  }

  return deleteAdminLegacyApi(event, `/admin/purchase-order/${id}`, {}, {
    fallbackMessage: 'Unable to delete purchase order',
  });
});
