import { createError, getRouterParam, readBody } from 'h3';
import { patchAdminLegacyApi } from '../../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Application id is required' });
  }

  const body = (await readBody(event)) as Record<string, unknown>;

  return patchAdminLegacyApi(event, `/admin/credit/${id}/approve`, body, {
    fallbackMessage: 'Unable to approve credit application',
  });
});
