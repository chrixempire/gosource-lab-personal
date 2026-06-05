import { createError, getRouterParam, readBody } from 'h3';
import { postAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const targetId = getRouterParam(event, 'targetId');
  if (!targetId) {
    throw createError({ statusCode: 400, statusMessage: 'Note target id is required' });
  }

  const body = (await readBody(event)) as Record<string, unknown>;

  return postAdminLegacyApi(event, `/admin/credit/${targetId}/notes`, body, {
    fallbackMessage: 'Unable to create internal note',
  });
});
