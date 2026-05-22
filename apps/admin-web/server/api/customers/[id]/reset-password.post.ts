import { createError, getRouterParam } from 'h3';
import { postAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Customer id is required' });
  }

  return postAdminLegacyApi(event, `/admin/customer/${id}/reset-password`, {}, {
    fallbackMessage: 'Unable to send password reset email',
  });
});
