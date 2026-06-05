import { createError, getRouterParam } from 'h3';
import { deleteAdminLegacyApi } from '../../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Application id is required' });
  }

  return deleteAdminLegacyApi(event, `/admin/credit/${id}/checklist`, {}, {
    fallbackMessage: 'Unable to delete checklist',
  });
});
