import type { DiscountListFilters, DiscountStatus } from '~/types/discounts';

export const DEFAULT_DISCOUNT_LIST_FILTERS: DiscountListFilters = {
  coupon: '',
  discountType: [],
  status: [],
  startDate: '',
  endDate: '',
  expiredDateFrom: '',
  expiredDateTo: '',
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

export function parseDiscountListFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): DiscountListFilters {
  const page = Number(readString(query, 'page'));
  const limit = Number(readString(query, 'limit'));

  return {
    coupon: readString(query, 'coupon'),
    discountType: readStringArray(query, 'discountType'),
    status: readStringArray(query, 'status') as DiscountStatus[],
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
    expiredDateFrom: readString(query, 'expiredDateFrom'),
    expiredDateTo: readString(query, 'expiredDateTo'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 25, 50, 100].includes(limit) ? limit : 10,
  };
}

export function discountListFiltersToRouteQuery(filters: DiscountListFilters) {
  return {
    page: String(filters.page),
    limit: String(filters.limit),
    coupon: filters.coupon || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    expiredDateFrom: filters.expiredDateFrom || undefined,
    expiredDateTo: filters.expiredDateTo || undefined,
    discountType: filters.discountType.length > 0 ? filters.discountType : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
  };
}

export function discountListFiltersToApiQuery(filters: DiscountListFilters) {
  const trimmed = filters.coupon.trim();
  return {
    page: filters.page,
    limit: filters.limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...(trimmed ? { filterBy: 'code', filterValue: trimmed } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
  };
}

export function hasActiveDiscountFilters(filters: DiscountListFilters) {
  return (
    Boolean(filters.coupon) ||
    filters.discountType.length > 0 ||
    filters.status.length > 0 ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.expiredDateFrom) ||
    Boolean(filters.expiredDateTo)
  );
}
