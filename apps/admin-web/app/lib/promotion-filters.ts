import type { PromotionListFilters, PromotionStatus } from '~/types/promotions';

export const DEFAULT_PROMOTION_LIST_FILTERS: PromotionListFilters = {
  name: '',
  status: [],
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10,
};

function readString(query: Record<string, string | string[] | undefined | null>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

function readStringArray(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const value = query[key];
  if (!value) {
    return [];
  }
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').filter(Boolean);
  }
  const values = Array.isArray(value) ? value : [value];
  return values.filter((entry) => entry.length > 0);
}

export function parsePromotionListFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): PromotionListFilters {
  const page = Number(readString(query, 'page'));
  const limit = Number(readString(query, 'limit'));

  return {
    name: readString(query, 'name'),
    status: readStringArray(query, 'status') as PromotionStatus[],
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 25, 50, 100].includes(limit) ? limit : 10,
  };
}

export function promotionListFiltersToRouteQuery(filters: PromotionListFilters) {
  return {
    page: String(filters.page),
    limit: String(filters.limit),
    name: filters.name || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
  };
}

/** Legacy list filter expects `expire`, not `expired`. */
function mapStatusForApi(status: PromotionStatus[]) {
  return status.map((entry) => (entry === 'expired' ? 'expire' : entry));
}

export function promotionListFiltersToApiQuery(filters: PromotionListFilters) {
  const trimmed = filters.name.trim();
  return {
    page: filters.page,
    limit: filters.limit,
    ...(trimmed ? { name: trimmed } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.status.length > 0 ? { status: mapStatusForApi(filters.status) } : {}),
  };
}

export function hasActivePromotionFilters(filters: PromotionListFilters) {
  return (
    Boolean(filters.name) ||
    filters.status.length > 0 ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate)
  );
}
