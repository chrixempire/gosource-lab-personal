import {
  ORDER_STATUS_FILTERS,
  orderStatusesForFilter,
  type OrderStatusFilter,
} from '~/lib/order-status';

export type TrackOrderListFilters = {
  amountMin: number | null;
  amountMax: number | null;
  status: OrderStatusFilter[];
};

export const TRACK_ORDER_STATUS_OPTIONS: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'refunded', label: 'Refunded' },
];

export const DEFAULT_TRACK_ORDER_STATUS: OrderStatusFilter = 'ongoing';

function readQueryString(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

export function parseTrackOrderStatusFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): OrderStatusFilter[] | null {
  const raw = readQueryString(query, 'status');
  if (raw === undefined) {
    return null;
  }

  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is OrderStatusFilter =>
      ORDER_STATUS_FILTERS.has(value as OrderStatusFilter),
    );
}

export function parseTrackOrderFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): TrackOrderListFilters {
  const amountFrom = readQueryString(query, 'amountFrom');
  const amountTo = readQueryString(query, 'amountTo');
  const status = parseTrackOrderStatusFromQuery(query);

  return {
    amountMin: amountFrom ? Number(amountFrom) : null,
    amountMax: amountTo ? Number(amountTo) : null,
    status: status ?? [DEFAULT_TRACK_ORDER_STATUS],
  };
}

export function trackOrderFiltersToRouteQuery(
  filters: TrackOrderListFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.amountMin != null && !Number.isNaN(filters.amountMin)) {
    query.amountFrom = String(filters.amountMin);
  }

  if (filters.amountMax != null && !Number.isNaN(filters.amountMax)) {
    query.amountTo = String(filters.amountMax);
  }

  if (filters.status.length > 0) {
    query.status = filters.status.join(',');
  } else {
    // Explicit empty value = no status filter (all orders), distinct from omitting the param (default ongoing).
    query.status = '';
  }

  return query;
}

export function trackOrderStatusFiltersToApiStatus(
  filters: OrderStatusFilter[],
): string | undefined {
  if (filters.length === 0) {
    return undefined;
  }

  const statuses = filters.flatMap((filter) => orderStatusesForFilter(filter));
  return [...new Set(statuses)].join(',');
}

export function hasActiveTrackOrderFilters(input: {
  filters: TrackOrderListFilters;
  search: string;
  hasDefaultStatusOnly: boolean;
}) {
  if (input.search.trim()) {
    return true;
  }

  if (input.filters.amountMin != null || input.filters.amountMax != null) {
    return true;
  }

  if (!input.hasDefaultStatusOnly) {
    return true;
  }

  return false;
}
