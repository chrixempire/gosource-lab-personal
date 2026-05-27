export const INSIGHT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_INSIGHT_PAGE_SIZE = 10;

export type InsightPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

function readQueryString(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

export function parseInsightPaginationFromQuery(
  query: Record<string, string | string[] | undefined | null>,
) {
  const parsedPage = Number(readQueryString(query, 'insightPage') ?? '1');
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const parsedLimit = Number(readQueryString(query, 'insightLimit') ?? String(DEFAULT_INSIGHT_PAGE_SIZE));
  const limit = INSIGHT_PAGE_SIZE_OPTIONS.includes(
    parsedLimit as (typeof INSIGHT_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsedLimit
    : DEFAULT_INSIGHT_PAGE_SIZE;

  return { page, limit };
}

export function insightPaginationToRouteQuery(page: number, limit: number): Record<string, string> {
  return {
    insightPage: String(Math.max(1, page)),
    insightLimit: String(limit),
  };
}

export function buildInsightPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): InsightPaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    limit,
    total: totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

export function paginateInsightRows<T>(rows: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return rows.slice(start, start + limit);
}
