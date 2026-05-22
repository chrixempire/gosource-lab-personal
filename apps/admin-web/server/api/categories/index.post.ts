import { readBody } from 'h3';
import { postAdminLegacyFormData, postAdminLegacyMultipart } from '../../utils/admin-legacy-proxy';
import { readCategoryFormData } from '../../utils/category-multipart';

export default defineEventHandler(async (event) => {
  const contentType = getRequestHeader(event, 'content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await readCategoryFormData(event);
    return postAdminLegacyMultipart(event, '/admin/category', formData, {
      fallbackMessage: 'Unable to create category',
    });
  }

  const body = await readBody<{ name?: string; desc?: string }>(event);

  return postAdminLegacyFormData(event, '/admin/category', {
    name: body.name,
    desc: body.desc,
  }, {
    fallbackMessage: 'Unable to create category',
  });
});
