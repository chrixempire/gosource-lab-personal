import type { PurchaseOrderListFilters } from '~/types/purchase-orders';

export const DEFAULT_PURCHASE_ORDER_LIST_FILTERS: PurchaseOrderListFilters = {
  id: '',
  status: [],
  productType: [],
  startDate: '',
  endDate: '',
  expectedDateFrom: '',
  expectedDateTo: '',
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

export function parsePurchaseOrderListFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): PurchaseOrderListFilters {
  const page = Number(readString(query, 'page'));
  const limit = Number(readString(query, 'limit'));

  return {
    id: readString(query, 'id'),
    status: readStringArray(query, 'status') as PurchaseOrderListFilters['status'],
    productType: readStringArray(
      query,
      'productType',
    ) as PurchaseOrderListFilters['productType'],
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
    expectedDateFrom: readString(query, 'expectedDateFrom'),
    expectedDateTo: readString(query, 'expectedDateTo'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 25, 50, 100].includes(limit) ? limit : 10,
  };
}

export function purchaseOrderListFiltersToRouteQuery(filters: PurchaseOrderListFilters) {
  const query: Record<string, string | string[] | undefined> = {
    page: String(filters.page),
    limit: String(filters.limit),
    id: filters.id || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    expectedDateFrom: filters.expectedDateFrom || undefined,
    expectedDateTo: filters.expectedDateTo || undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    productType: filters.productType.length > 0 ? filters.productType : undefined,
  };

  return query;
}

export function purchaseOrderListFiltersToApiQuery(filters: PurchaseOrderListFilters) {
  return {
    page: filters.page,
    limit: filters.limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filterOperator: 'AND',
    ...(filters.id ? { id: filters.id } : {}),
    ...(filters.status.length > 0 ? { status: filters.status } : {}),
    ...(filters.productType.length > 0 ? { productType: filters.productType } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.expectedDateFrom ? { expectedDateFrom: filters.expectedDateFrom } : {}),
    ...(filters.expectedDateTo ? { expectedDateTo: filters.expectedDateTo } : {}),
  };
}

export function hasActivePurchaseOrderFilters(filters: PurchaseOrderListFilters) {
  return (
    Boolean(filters.id) ||
    filters.status.length > 0 ||
    filters.productType.length > 0 ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.expectedDateFrom) ||
    Boolean(filters.expectedDateTo)
  );
}
