import { readBody } from 'h3';
import { patchAdminLegacyFormData, patchAdminLegacyMultipart } from '../../utils/admin-legacy-proxy';
import { readCategoryFormData } from '../../utils/category-multipart';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category id is required',
    });
  }

  const contentType = getRequestHeader(event, 'content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await readCategoryFormData(event);
    return patchAdminLegacyMultipart(event, `/admin/category/${id}`, formData, {
      fallbackMessage: 'Unable to update category',
    });
  }

  const body = await readBody<{ name?: string; desc?: string }>(event);

  return patchAdminLegacyFormData(event, `/admin/category/${id}`, {
    name: body.name,
    desc: body.desc,
  }, {
    fallbackMessage: 'Unable to update category',
  });
});
