import type { ActivityLogAction, ActivityLogInitiatorType, ActivityLogListFilters } from '~/types/activity-log';

export const DEFAULT_ACTIVITY_LOG_FILTERS: ActivityLogListFilters = {
  search: '',
  module: '',
  action: '',
  initiatorType: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 20,
};

export const ACTIVITY_LOG_ACTION_OPTIONS: { value: ActivityLogAction; label: string }[] = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'VIEW', label: 'View' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'OTHERS', label: 'Other' },
];

export const ACTIVITY_LOG_INITIATOR_OPTIONS: { value: ActivityLogInitiatorType; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'BUSINESS', label: 'Business' },
];

function readString(query: Record<string, string | string[] | undefined | null>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

export function parseActivityLogFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): ActivityLogListFilters {
  const page = Number(readString(query, 'page'));
  const limit = Number(readString(query, 'limit'));
  const action = readString(query, 'action') as ActivityLogListFilters['action'];
  const initiatorType = readString(query, 'initiatorType') as ActivityLogListFilters['initiatorType'];

  return {
    search: readString(query, 'search'),
    module: readString(query, 'module'),
    action: ACTIVITY_LOG_ACTION_OPTIONS.some((option) => option.value === action) ? action : '',
    initiatorType: ACTIVITY_LOG_INITIATOR_OPTIONS.some((option) => option.value === initiatorType)
      ? initiatorType
      : '',
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 20, 50, 100].includes(limit) ? limit : 20,
  };
}

export function activityLogFiltersToRouteQuery(filters: ActivityLogListFilters) {
  return {
    page: String(filters.page),
    limit: String(filters.limit),
    search: filters.search || undefined,
    module: filters.module || undefined,
    action: filters.action || undefined,
    initiatorType: filters.initiatorType || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  };
}

export function activityLogFiltersToApiQuery(filters: ActivityLogListFilters) {
  const search = filters.search.trim();
  const module = filters.module.trim();

  return {
    page: filters.page,
    limit: filters.limit,
    filterOperator: 'AND' as const,
    ...(search ? { search } : {}),
    ...(module ? { module } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.initiatorType ? { initiatorType: filters.initiatorType } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
  };
}

/**
 * Backend module names that make up the inventory section. Used to scope the
 * inventory activity-log page to items, categories and purchase orders.
 */
export const INVENTORY_ACTIVITY_MODULES = [
  'Product',
  'Category',
  'PurchaseOrder',
] as const;

/** Module dropdown options for the inventory activity-log page. */
export const INVENTORY_ACTIVITY_MODULE_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: 'Product', label: 'Items' },
  { value: 'Category', label: 'Categories' },
  { value: 'PurchaseOrder', label: 'Purchase orders' },
];

/**
 * API query for the inventory activity-log page. Reuses the shared query
 * builder but scopes results to the inventory modules — either the single
 * module the user picked, or all inventory modules via the `modules` $in list.
 */
export function inventoryActivityLogApiQuery(filters: ActivityLogListFilters) {
  const base = activityLogFiltersToApiQuery(filters);

  if (filters.module.trim()) {
    return base;
  }

  return {
    ...base,
    modules: INVENTORY_ACTIVITY_MODULES.join(','),
  };
}

export function hasActiveActivityLogFilters(filters: ActivityLogListFilters) {
  return Boolean(
    filters.search.trim() ||
      filters.module.trim() ||
      filters.action ||
      filters.initiatorType ||
      filters.startDate ||
      filters.endDate,
  );
}
