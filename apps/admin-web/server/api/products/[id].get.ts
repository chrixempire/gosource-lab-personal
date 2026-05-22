import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product id is required',
    });
  }

  return fetchAdminLegacyApi(event, `/admin/product/${id}`, {
    fallbackMessage: 'Unable to load product',
  });
});
