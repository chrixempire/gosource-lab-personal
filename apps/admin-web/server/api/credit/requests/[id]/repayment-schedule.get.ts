import { createError, getQuery, getRouterParam } from 'h3';
import { fetchAdminLegacyApi } from '../../../../utils/admin-legacy-proxy';
import { readCreditPaginationQuery } from '../../../../utils/credit-list-query';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Credit request id is required' });
  }

  const query = getQuery(event) as Record<string, unknown>;
  const pagination = readCreditPaginationQuery(query);

  return fetchAdminLegacyApi(event, `/admin/credit/requests/${id}/repayment-schedule`, {
    query: pagination,
    fallbackMessage: 'Unable to load repayment schedule',
  });
});
