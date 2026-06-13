import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Stock count id is required',
    });
  }

  return fetchAdminLegacyApi(event, `/admin/product/stock-counts/${id}`, {
    fallbackMessage: 'Unable to load stock count',
  });
});
