import { patchAdminLegacyMultipart } from '../../utils/admin-legacy-proxy';
import { readProductMultipartFormData } from '../../utils/product-multipart';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product id is required',
    });
  }

  const contentType = getRequestHeader(event, 'content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await readProductMultipartFormData(event);
    return patchAdminLegacyMultipart(event, `/admin/product/${id}`, formData, {
      fallbackMessage: 'Unable to update product',
    });
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Product update requires multipart form data',
  });
});
