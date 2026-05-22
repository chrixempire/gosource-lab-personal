import type { OrderListFilters } from '~/types/orders';

export const DEFAULT_ORDER_LIST_FILTERS: OrderListFilters = {
  amountMin: null,
  amountMax: null,
  business: '',
  paymentMethod: [],
  paymentStatus: [],
  status: [],
  startDate: '',
  endDate: '',
  reference: '',
  page: 1,
  limit: 25,
};

function readQueryString(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

function readQueryStringArray(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  if (!entry) {
    return [];
  }

  return (Array.isArray(entry) ? entry : [entry]).filter(Boolean) as string[];
}

function readQueryNumber(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
  fallback: number,
) {
  const raw = readQueryString(query, key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseOrderListFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): OrderListFilters {
  const amountFrom = readQueryString(query, 'amountFrom');
  const amountTo = readQueryString(query, 'amountTo');

  return {
    amountMin: amountFrom ? Number(amountFrom) : null,
    amountMax: amountTo ? Number(amountTo) : null,
    business: readQueryString(query, 'business') ?? '',
    paymentMethod: readQueryStringArray(query, 'paymentMethod'),
    paymentStatus: readQueryStringArray(query, 'paymentStatus'),
    status: readQueryStringArray(query, 'status'),
    startDate: readQueryString(query, 'startDate') ?? '',
    endDate: readQueryString(query, 'endDate') ?? '',
    reference: readQueryString(query, 'reference') ?? '',
    page: readQueryNumber(query, 'page', DEFAULT_ORDER_LIST_FILTERS.page),
    limit: readQueryNumber(query, 'limit', DEFAULT_ORDER_LIST_FILTERS.limit),
  };
}

export function orderListFiltersToRouteQuery(
  filters: OrderListFilters,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {
    page: String(filters.page),
    limit: String(filters.limit),
  };

  if (filters.reference.trim()) {
    query.reference = filters.reference.trim();
  }

  if (filters.amountMin != null && !Number.isNaN(filters.amountMin)) {
    query.amountFrom = String(filters.amountMin);
  }

  if (filters.amountMax != null && !Number.isNaN(filters.amountMax)) {
    query.amountTo = String(filters.amountMax);
  }

  if (filters.business) {
    query.business = filters.business;
  }

  if (filters.startDate) {
    query.startDate = filters.startDate;
  }

  if (filters.endDate) {
    query.endDate = filters.endDate;
  }

  if (filters.paymentMethod.length > 0) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.paymentStatus.length > 0) {
    query.paymentStatus = filters.paymentStatus;
  }

  if (filters.status.length > 0) {
    query.status = filters.status;
  }

  return query;
}

export function orderListFiltersToApiQuery(filters: OrderListFilters) {
  return {
    page: filters.page,
    limit: filters.limit,
    reference: filters.reference.trim() || undefined,
    amountFrom: filters.amountMin ?? undefined,
    amountTo: filters.amountMax ?? undefined,
    business: filters.business || undefined,
    paymentMethod: filters.paymentMethod.length > 0 ? filters.paymentMethod : undefined,
    paymentStatus: filters.paymentStatus.length > 0 ? filters.paymentStatus : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  };
}

export function countActiveOrderFilters(filters: OrderListFilters) {
  let count = 0;

  if (filters.reference.trim()) {
    count += 1;
  }
  if (filters.amountMin != null || filters.amountMax != null) {
    count += 1;
  }
  if (filters.business) {
    count += 1;
  }
  if (filters.paymentMethod.length > 0) {
    count += 1;
  }
  if (filters.paymentStatus.length > 0) {
    count += 1;
  }
  if (filters.status.length > 0) {
    count += 1;
  }
  if (filters.startDate || filters.endDate) {
    count += 1;
  }

  return count;
}

export function hasActiveOrderFilters(filters: OrderListFilters) {
  return countActiveOrderFilters(filters) > 0;
}
