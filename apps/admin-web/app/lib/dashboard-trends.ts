import type { DashboardDateFilterType, DashboardDateFilterValue, DashboardTrendPoint } from '~/types/dashboard';

export type DashboardTrendMetric = 'count' | 'value';

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatHourKey(date: Date, hour: number) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(hour)}:00`;
}

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function startOfWeekMonday(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatHourLabel(hour: number) {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

export function isHourlyTrendFilter(filterType: DashboardDateFilterType) {
  return filterType === 'current_date' || filterType === 'yesterday';
}

export function isMonthDayTrendFilter(filterType: DashboardDateFilterType) {
  return filterType === 'this_month' || filterType === 'last_month';
}

/** Show every bucket on the x-axis (no Chart.js auto-skip). */
export function showsEveryTrendAxisLabel(filterType: DashboardDateFilterType) {
  return isHourlyTrendFilter(filterType) || isMonthDayTrendFilter(filterType);
}

export function isYearMonthTrendFilter(filterType: DashboardDateFilterType) {
  return filterType === 'this_year' || filterType === 'last_year' || filterType === 'all_time';
}

function parseDayKey(key: string): Date | null {
  const match = key.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseMonthKey(key: string): Date | null {
  const match = key.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = new Date(year, month - 1, 1);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Bar chart tooltip title — includes month name where the axis only shows day or month abbrev. */
export function formatTrendTooltipTitle(
  filterType: DashboardDateFilterType,
  point: DashboardTrendPoint,
): string {
  const raw = point.date || point.label;

  if (isMonthDayTrendFilter(filterType) || filterType === 'custom_range') {
    const date = parseDayKey(raw);
    if (date) {
      return new Intl.DateTimeFormat('en-NG', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }
  }

  if (isYearMonthTrendFilter(filterType)) {
    const date = parseMonthKey(raw);
    if (date) {
      return new Intl.DateTimeFormat('en-NG', {
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
  }

  return point.label;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function buildTrendAxis(filter: DashboardDateFilterValue): {
  keys: string[];
  labels: string[];
} {
  const now = new Date();
  const keys: string[] = [];
  const labels: string[] = [];

  switch (filter.filterType) {
    case 'current_date': {
      for (let hour = 0; hour < 24; hour += 1) {
        keys.push(formatHourKey(now, hour));
        labels.push(formatHourLabel(hour));
      }
      break;
    }
    case 'yesterday': {
      const day = addDays(now, -1);
      for (let hour = 0; hour < 24; hour += 1) {
        keys.push(formatHourKey(day, hour));
        labels.push(formatHourLabel(hour));
      }
      break;
    }
    case 'this_week':
    case 'last_week': {
      const weekStart =
        filter.filterType === 'last_week'
          ? addDays(startOfWeekMonday(now), -7)
          : startOfWeekMonday(now);
      for (let index = 0; index < 7; index += 1) {
        const day = addDays(weekStart, index);
        keys.push(formatDayKey(day));
        labels.push(WEEKDAY_LABELS[index] ?? formatDayKey(day));
      }
      break;
    }
    case 'this_month':
    case 'last_month': {
      const ref =
        filter.filterType === 'last_month'
          ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
          : new Date(now.getFullYear(), now.getMonth(), 1);
      const year = ref.getFullYear();
      const month = ref.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        keys.push(formatDayKey(date));
        labels.push(String(day));
      }
      break;
    }
    case 'this_year':
    case 'last_year': {
      const year =
        filter.filterType === 'last_year' ? now.getFullYear() - 1 : now.getFullYear();
      for (let month = 0; month < 12; month += 1) {
        const date = new Date(year, month, 1);
        keys.push(formatMonthKey(date));
        labels.push(MONTH_LABELS[month] ?? formatMonthKey(date));
      }
      break;
    }
    case 'custom_range': {
      if (filter.startDate && filter.endDate) {
        const start = new Date(filter.startDate);
        const end = new Date(filter.endDate);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
          let cursor = new Date(start);
          while (cursor <= end) {
            keys.push(formatDayKey(cursor));
            labels.push(formatDayKey(cursor).slice(5));
            cursor = addDays(cursor, 1);
          }
        }
      }
      break;
    }
    case 'all_time':
    default: {
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        keys.push(formatMonthKey(date));
        labels.push(MONTH_LABELS[date.getMonth()] ?? formatMonthKey(date));
      }
      break;
    }
  }

  return { keys, labels };
}

function resolvePointIndex(
  filterType: DashboardDateFilterType,
  rawKey: string,
  axisKeys: string[],
): number | null {
  const key = rawKey.trim();
  if (!key) {
    return null;
  }

  const exact = axisKeys.indexOf(key);
  if (exact >= 0) {
    return exact;
  }

  if (filterType === 'current_date' || filterType === 'yesterday') {
    const match = key.match(/(\d{1,2}):00$/);
    if (match) {
      const hour = Number(match[1]);
      return hour >= 0 && hour < 24 ? hour : null;
    }
  }

  const dayPrefix = key.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPrefix)) {
    const index = axisKeys.findIndex((axisKey) => axisKey.startsWith(dayPrefix) || axisKey === dayPrefix);
    if (index >= 0) {
      return index;
    }
  }

  const monthPrefix = key.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(monthPrefix)) {
    const index = axisKeys.findIndex((axisKey) => axisKey.startsWith(monthPrefix) || axisKey === monthPrefix);
    if (index >= 0) {
      return index;
    }
  }

  return null;
}

export function fillTrendPoints(
  filter: DashboardDateFilterValue,
  rawPoints: DashboardTrendPoint[],
): DashboardTrendPoint[] {
  const { keys, labels } = buildTrendAxis(filter);

  if (!keys.length) {
    return rawPoints.map((point) => ({
      ...point,
      label: point.label || point.date,
    }));
  }

  const merged = new Map<number, DashboardTrendPoint>();

  for (const point of rawPoints) {
    const index = resolvePointIndex(filter.filterType, point.date || point.label, keys);
    if (index == null) {
      continue;
    }

    const existing = merged.get(index);
    if (existing) {
      existing.orderCount += point.orderCount ?? 0;
      existing.totalValue += point.totalValue ?? 0;
    } else {
      merged.set(index, {
        label: labels[index] ?? keys[index] ?? point.label,
        date: keys[index] ?? point.date,
        orderCount: point.orderCount ?? 0,
        totalValue: point.totalValue ?? 0,
      });
    }
  }

  return keys.map((axisKey, index) => {
    const hit = merged.get(index);
    return {
      label: labels[index] ?? axisKey,
      date: axisKey,
      orderCount: hit?.orderCount ?? 0,
      totalValue: hit?.totalValue ?? 0,
    };
  });
}

export function trendMetricValue(point: DashboardTrendPoint, metric: DashboardTrendMetric) {
  return metric === 'value' ? point.totalValue : point.orderCount;
}

export function trendHasActivity(points: DashboardTrendPoint[]) {
  return points.some((point) => point.orderCount > 0 || point.totalValue > 0);
}
