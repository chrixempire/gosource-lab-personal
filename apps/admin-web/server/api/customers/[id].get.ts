import { createError, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Customer id is required' });
  }
  return fetchAdminLegacyApi(event, `/admin/customer/${id}`, {
    fallbackMessage: 'Unable to load customer',
  });
});
