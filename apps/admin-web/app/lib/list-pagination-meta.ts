type PaginatedMeta = {
  page: number;
  limit: number;
};

export function withRoutePaginationMeta<T extends PaginatedMeta>(
  meta: T,
  page: number,
  limit: number,
): T {
  return {
    ...meta,
    page,
    limit,
  };
}
