import { patchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product id is required',
    });
  }

  const body = await readBody(event);

  return patchAdminLegacyApi(event, `/admin/product/${id}/add-stock`, body ?? {}, {
    fallbackMessage: 'Unable to add stock',
  });
});
