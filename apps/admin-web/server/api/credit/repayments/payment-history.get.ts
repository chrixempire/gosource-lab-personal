import { getQuery } from 'h3';
import { fetchFilteredPaymentHistory } from '../../../utils/credit-bff-list';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  return fetchFilteredPaymentHistory(event, query);
});
