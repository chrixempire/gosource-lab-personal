import type { CustomerListFilters } from '~/types/customers';

export const DEFAULT_CUSTOMER_LIST_FILTERS: CustomerListFilters = {
  search: '',
  accountType: [],
  status: [],
  useCredit: [],
  amountMin: '',
  amountMax: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10,
};

function readString(query: Record<string, string | string[] | undefined | null>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return typeof value === 'string' ? value : '';
}

function readStringArray(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const value = query[key];
  if (!value) return [];
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').filter(Boolean);
  }
  const values = Array.isArray(value) ? value : [value];
  return values.filter((entry) => entry.length > 0);
}

export function parseCustomerListFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): CustomerListFilters {
  const page = Number(readString(query, 'page'));
  const limit = Number(readString(query, 'limit'));

  return {
    search: readString(query, 'search'),
    accountType: readStringArray(query, 'accountType') as CustomerListFilters['accountType'],
    status: readStringArray(query, 'status') as CustomerListFilters['status'],
    useCredit: readStringArray(query, 'useCredit') as CustomerListFilters['useCredit'],
    amountMin: readString(query, 'amountMin'),
    amountMax: readString(query, 'amountMax'),
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 25, 50, 100].includes(limit) ? limit : 10,
  };
}

export function customerListFiltersToRouteQuery(filters: CustomerListFilters) {
  return {
    page: String(filters.page),
    limit: String(filters.limit),
    search: filters.search || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    amountMin: filters.amountMin || undefined,
    amountMax: filters.amountMax || undefined,
    accountType: filters.accountType.length > 0 ? filters.accountType : undefined,
    status: filters.status.length > 0 ? filters.status : undefined,
    useCredit: filters.useCredit.length > 0 ? filters.useCredit : undefined,
  };
}

export function customerListFiltersToApiQuery(filters: CustomerListFilters) {
  const query: Record<string, string | number | boolean | string[]> = {
    page: filters.page,
    limit: filters.limit,
  };

  const trimmed = filters.search.trim();
  if (trimmed) {
    query.search = trimmed;
  }
  if (filters.startDate) {
    query.startDate = filters.startDate;
  }
  if (filters.endDate) {
    query.endDate = filters.endDate;
  }
  if (filters.amountMin) {
    query.amountFrom = Number(filters.amountMin);
  }
  if (filters.amountMax) {
    query.amountTo = Number(filters.amountMax);
  }
  if (filters.accountType.length > 0) {
    query.accountType = filters.accountType;
  }
  if (filters.status.length === 1) {
    query.customerStatus = filters.status[0] === 'active' ? 'true' : 'false';
  }
  if (filters.useCredit.length === 1) {
    query.useCredit = filters.useCredit[0] === 'enabled' ? 'true' : 'false';
  }

  return query;
}

export function hasActiveCustomerFilters(filters: CustomerListFilters) {
  return (
    Boolean(filters.search) ||
    filters.accountType.length > 0 ||
    filters.status.length > 0 ||
    filters.useCredit.length > 0 ||
    Boolean(filters.amountMin) ||
    Boolean(filters.amountMax) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate)
  );
}
