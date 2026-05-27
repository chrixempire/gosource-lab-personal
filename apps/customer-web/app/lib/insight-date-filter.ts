export type InsightDateFilterType =
  | 'current_date'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year';

export type InsightDateFilterValue = {
  filterType: InsightDateFilterType;
};

export const DEFAULT_INSIGHT_DATE_FILTER: InsightDateFilterType = 'this_month';

export const INSIGHT_DATE_PRESETS: Array<{
  label: string;
  value: InsightDateFilterType;
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

const INSIGHT_DATE_FILTER_TYPES = new Set<InsightDateFilterType>(
  INSIGHT_DATE_PRESETS.map((preset) => preset.value),
);

function readQueryString(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

export function isInsightDateFilterType(value: string): value is InsightDateFilterType {
  return INSIGHT_DATE_FILTER_TYPES.has(value as InsightDateFilterType);
}

export function parseInsightDateFilterFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): InsightDateFilterValue {
  const raw = readQueryString(query, 'insightPeriod');
  const filterType =
    raw && isInsightDateFilterType(raw) ? raw : DEFAULT_INSIGHT_DATE_FILTER;

  return { filterType };
}

export function insightDateFilterToRouteQuery(
  filter: InsightDateFilterValue,
): Record<string, string> {
  return {
    insightPeriod: filter.filterType,
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

export function resolveInsightDateRange(filter: InsightDateFilterValue) {
  const now = new Date();

  switch (filter.filterType) {
    case 'current_date':
      return {
        startDate: startOfDay(now).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };
    case 'yesterday': {
      const day = new Date(now);
      day.setDate(day.getDate() - 1);
      return {
        startDate: startOfDay(day).toISOString(),
        endDate: endOfDay(day).toISOString(),
      };
    }
    case 'this_week':
      return {
        startDate: startOfWeek(now).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };
    case 'last_week': {
      const start = startOfWeek(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return {
        startDate: start.toISOString(),
        endDate: endOfDay(end).toISOString(),
      };
    }
    case 'this_month': {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString(),
        endDate: end.toISOString(),
      };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }
    case 'this_year':
      return {
        startDate: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).toISOString(),
        endDate: endOfDay(now).toISOString(),
      };
    case 'last_year': {
      const year = now.getFullYear() - 1;
      return {
        startDate: new Date(year, 0, 1, 0, 0, 0, 0).toISOString(),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    }
    default:
      return resolveInsightDateRange({ filterType: DEFAULT_INSIGHT_DATE_FILTER });
  }
}

export function insightPeriodLabel(filter: InsightDateFilterValue) {
  return (
    INSIGHT_DATE_PRESETS.find((preset) => preset.value === filter.filterType)?.label ??
    'This month'
  );
}

export const INSIGHT_FILTER_MENU_ITEM_CLASS =
  'justify-between gap-3 font-medium data-[highlighted]:bg-primary-50/70 data-[highlighted]:text-primary-500';

export function insightFilterMenuItemClass(selected: boolean) {
  return selected
    ? `${INSIGHT_FILTER_MENU_ITEM_CLASS} bg-primary-50/70 text-primary-500`
    : INSIGHT_FILTER_MENU_ITEM_CLASS;
}
