import { createError, getQuery, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';
import { readCreditPaginationQuery } from '../../../utils/credit-list-query';

export default defineEventHandler(async (event) => {
  const targetId = getRouterParam(event, 'targetId');
  if (!targetId) {
    throw createError({ statusCode: 400, statusMessage: 'Note target id is required' });
  }

  const query = getQuery(event) as Record<string, unknown>;
  const pagination = readCreditPaginationQuery(query);
  const noteType = query.noteType != null ? String(query.noteType) : undefined;

  return fetchAdminLegacyApi(event, `/admin/credit/${targetId}/notes`, {
    query: {
      ...pagination,
      noteType,
    },
    fallbackMessage: 'Unable to load internal notes',
  });
});
