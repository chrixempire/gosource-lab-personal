import { createError, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Credit request id is required' });
  }

  return fetchAdminLegacyApi(event, `/admin/credit/requests/${id}`, {
    fallbackMessage: 'Unable to load credit request',
  });
});
