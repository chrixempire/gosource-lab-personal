import { getQuery } from 'h3';
import { buildCreditTopPerformers } from '../../../utils/credit-analytics-top-performers';
import { readCreditPaginationQuery } from '../../../utils/credit-list-query';

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const pagination = readCreditPaginationQuery(query);
  const limit = Math.min(Math.max(pagination.limit, 1), 50);

  const performers = await buildCreditTopPerformers(event, limit);

  return {
    data: {
      performers,
      meta: {
        page: 1,
        limit,
        total: performers.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  };
});
