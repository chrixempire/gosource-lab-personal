import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  return fetchAdminLegacyApi(event, '/admin/credit/repayment-schedules/overdue', {
    query: query as Record<string, string | number | boolean | string[] | number[]>,
    fallbackMessage: 'Unable to load overdue repayments',
  });
});
