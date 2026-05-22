import { postAdminLegacyFormData, postAdminLegacyMultipart } from '../../utils/admin-legacy-proxy';
import { readProductMultipartFormData } from '../../utils/product-multipart';

export default defineEventHandler(async (event) => {
  const contentType = getRequestHeader(event, 'content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await readProductMultipartFormData(event);
    return postAdminLegacyMultipart(event, '/admin/product', formData, {
      fallbackMessage: 'Unable to create product',
    });
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Product creation requires multipart form data',
  });
});
