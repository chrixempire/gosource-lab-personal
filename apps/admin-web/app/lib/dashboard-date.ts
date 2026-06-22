import type { DashboardDateFilterType, DashboardDateFilterValue } from '~/types/dashboard';

export const DASHBOARD_DATE_PRESETS: Array<{
  label: string;
  value: DashboardDateFilterType;
}> = [
  { label: 'Today', value: 'current_date' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last week', value: 'last_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This year', value: 'this_year' },
  { label: 'Last year', value: 'last_year' },
];

const DASHBOARD_DATE_FILTER_TYPES: DashboardDateFilterType[] = [
  'current_date',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
  'this_year',
  'last_year',
  'custom_range',
  'all_time',
];

export function createDefaultDashboardDateFilter(): DashboardDateFilterValue {
  return { filterType: 'current_date' };
}

export function isDashboardDateFilterType(value: string): value is DashboardDateFilterType {
  return DASHBOARD_DATE_FILTER_TYPES.includes(value as DashboardDateFilterType);
}

export function parseDashboardDateFilterFromQuery(
  query: Record<string, string | null | Array<string | null> | undefined>,
): DashboardDateFilterValue {
  const rawFilter = Array.isArray(query.filter) ? query.filter[0] : query.filter;
  const filterType = isDashboardDateFilterType(String(rawFilter ?? ''))
    ? (rawFilter as DashboardDateFilterType)
    : 'current_date';

  const startDate = Array.isArray(query.startDate) ? query.startDate[0] : query.startDate;
  const endDate = Array.isArray(query.endDate) ? query.endDate[0] : query.endDate;

  if (filterType === 'custom_range') {
    return createDefaultDashboardDateFilter();
  }

  return { filterType };
}

export function dashboardDateFilterToQuery(filter: DashboardDateFilterValue) {
  const query: Record<string, string | undefined> = {
    filter: filter.filterType,
  };

  if (filter.filterType === 'custom_range') {
    query.startDate = filter.startDate;
    query.endDate = filter.endDate;
  } else {
    query.startDate = undefined;
    query.endDate = undefined;
  }

  return query;
}

/** Dropdown item styles aligned with customer-web nav hover. */
export const DASHBOARD_FILTER_MENU_ITEM_CLASS =
  'justify-between gap-3 font-medium data-[highlighted]:bg-primary-50/70 data-[highlighted]:text-primary-500';

export function dashboardFilterMenuItemClass(selected: boolean) {
  return selected
    ? `${DASHBOARD_FILTER_MENU_ITEM_CLASS} bg-primary-50/70 text-primary-500`
    : DASHBOARD_FILTER_MENU_ITEM_CLASS;
}

export function toDashboardQueryParams(filter: DashboardDateFilterValue): {
  filterType: string;
  startDate?: string;
  endDate?: string;
} {
  const params: { filterType: string; startDate?: string; endDate?: string } = {
    filterType: filter.filterType,
  };

  if (filter.filterType === 'custom_range') {
    if (filter.startDate) {
      params.startDate = filter.startDate;
    }
    if (filter.endDate) {
      params.endDate = filter.endDate;
    }
  }

  return params;
}

export function formatDashboardCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat('en-NG').format(value ?? 0);
}

export const DASHBOARD_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#0EA5E9',
  shipped: '#3B82F6',
  partially_delivered: '#8B5CF6',
  delivered: '#22C55E',
  completed: '#14B8A6',
  cancelled: '#EF4444',
  refunded: '#F97316',
  other: '#94A3B8',
};

export function formatDashboardStatusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Pie chart label for grouped statuses not shown as their own slice. */
export function formatDashboardPieStatusLabel(status: string) {
  if (status === 'other') {
    return 'Other statuses';
  }

  return formatDashboardStatusLabel(status);
}

/**
 * Orders bucketed as "other" on the dashboard pie chart — any status that is not
 * pending, shipped, partially delivered, delivered, or cancelled.
 */
export const DASHBOARD_PIE_OTHER_STATUSES_HINT =
  'Includes statuses such as confirmed, accepted, ready, and returned.';
