import { createError, getRouterParam } from 'h3';
import { postAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase order id is required' });
  }

  return postAdminLegacyApi(event, `/admin/purchase-order/${id}/cancel-remaining-items`, {}, {
    fallbackMessage: 'Unable to cancel remaining items',
  });
});
