import { createError, getRouterParam, readBody } from 'h3';
import { postAdminLegacyApi } from '../../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Application id is required' });
  }

  const body = (await readBody(event)) as { documents?: string[] };

  return postAdminLegacyApi(event, `/admin/credit/${id}/initialise-checklist`, body, {
    fallbackMessage: 'Unable to initialise checklist',
  });
});
