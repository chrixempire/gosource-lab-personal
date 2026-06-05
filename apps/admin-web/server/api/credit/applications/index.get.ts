import { getQuery } from 'h3';
import { fetchFilteredCreditApplications } from '../../../utils/credit-bff-list';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  return fetchFilteredCreditApplications(event, query);
});
