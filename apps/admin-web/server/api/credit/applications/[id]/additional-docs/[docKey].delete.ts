import { createError, getRouterParam } from 'h3';
import { deleteAdminLegacyApi } from '../../../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const docKey = getRouterParam(event, 'docKey');
  if (!id || !docKey) {
    throw createError({ statusCode: 400, statusMessage: 'Application id and document key are required' });
  }

  return deleteAdminLegacyApi(event, `/admin/credit/${id}/additional-docs/${encodeURIComponent(docKey)}`, {}, {
    fallbackMessage: 'Unable to delete document',
  });
});
