import type { RequestRecord } from '@gosource/api-client';

export type RequestStatusFilter = RequestRecord['status'];

export type RequestListFilters = {
  amountMin: number | null;
  amountMax: number | null;
  status: RequestStatusFilter[];
};

export const REQUEST_STATUS_OPTIONS: Array<{ value: RequestStatusFilter; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const REQUEST_STATUS_SET = new Set<RequestStatusFilter>(
  REQUEST_STATUS_OPTIONS.map((option) => option.value),
);

function readQueryString(
  query: Record<string, string | Array<string | null> | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

export function parseRequestStatusFromQuery(
  query: Record<string, string | Array<string | null> | undefined | null>,
): RequestStatusFilter[] | null {
  const raw = readQueryString(query, 'status');
  if (raw == null) {
    return null;
  }

  if (!raw.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is RequestStatusFilter => REQUEST_STATUS_SET.has(value as RequestStatusFilter));
}

export function parseRequestFiltersFromQuery(
  query: Record<string, string | Array<string | null> | undefined | null>,
): RequestListFilters {
  const amountFrom = readQueryString(query, 'amountFrom');
  const amountTo = readQueryString(query, 'amountTo');
  const status = parseRequestStatusFromQuery(query);

  return {
    amountMin: amountFrom ? Number(amountFrom) : null,
    amountMax: amountTo ? Number(amountTo) : null,
    status: status ?? [],
  };
}

export function requestFiltersToRouteQuery(
  filters: RequestListFilters,
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
    query.status = '';
  }

  return query;
}

export function requestStatusFiltersToApiParam(
  filters: RequestStatusFilter[],
): string | undefined {
  if (filters.length === 0) {
    return undefined;
  }

  return filters.join(',');
}

export function hasActiveRequestFilters(input: {
  filters: RequestListFilters;
  search: string;
}) {
  if (input.search.trim()) {
    return true;
  }

  if (input.filters.amountMin != null || input.filters.amountMax != null) {
    return true;
  }

  if (input.filters.status.length > 0) {
    return true;
  }

  return false;
}

export function requestMatchesListFilters(
  request: Pick<RequestRecord, 'status' | 'branchId' | 'totalPrice'>,
  filters: RequestListFilters,
  options?: { branchId?: string },
) {
  if (filters.status.length > 0 && !filters.status.includes(request.status)) {
    return false;
  }

  const branchId = options?.branchId?.trim();
  if (branchId && request.branchId !== branchId) {
    return false;
  }

  if (filters.amountMin != null && request.totalPrice < filters.amountMin) {
    return false;
  }

  if (filters.amountMax != null && request.totalPrice > filters.amountMax) {
    return false;
  }

  return true;
}
