import { createError, getHeader, getRouterParam } from 'h3';
import { postAdminLegacyMultipart } from '../../../../utils/admin-legacy-proxy';
import { readCreditMultipartFormData } from '../../../../utils/credit-multipart';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Application id is required' });
  }

  const contentType = getHeader(event, 'content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Additional documents require multipart form data',
    });
  }

  const formData = await readCreditMultipartFormData(event);

  return postAdminLegacyMultipart(event, `/admin/credit/${id}/additional-docs`, formData, {
    fallbackMessage: 'Unable to upload additional documents',
  });
});
