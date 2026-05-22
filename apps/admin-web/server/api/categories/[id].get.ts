import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category id is required',
    });
  }

  return fetchAdminLegacyApi(event, `/admin/category/${id}`, {
    fallbackMessage: 'Unable to load category',
  });
});
