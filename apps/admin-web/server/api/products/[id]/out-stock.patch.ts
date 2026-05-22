import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product id is required',
    });
  }

  return patchAdminLegacyApi(event, `/admin/product/${id}/out-stock`, {}, {
    fallbackMessage: 'Unable to mark product out of stock',
  });
});
