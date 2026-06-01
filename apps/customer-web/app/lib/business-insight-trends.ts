import type { InsightDateFilterType, InsightDateFilterValue } from '~/lib/insight-date-filter';

export type SpendTrendPoint = {
  label: string;
  date?: string;
  totalSpend: number;
  orderCount: number;
};

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

export function isHourlySpendTrendFilter(filterType: InsightDateFilterType) {
  return filterType === 'current_date' || filterType === 'yesterday';
}

export function isMonthDaySpendTrendFilter(filterType: InsightDateFilterType) {
  return filterType === 'this_month' || filterType === 'last_month';
}

export function isWeekdaySpendTrendFilter(filterType: InsightDateFilterType) {
  return filterType === 'this_week' || filterType === 'last_week';
}

export function isYearMonthSpendTrendFilter(filterType: InsightDateFilterType) {
  return filterType === 'this_year' || filterType === 'last_year';
}

/** Hourly views may show every tick when the chart is wide enough; month/day uses auto-skip on narrow screens. */
export function showsEverySpendTrendAxisLabel(filterType: InsightDateFilterType) {
  return isHourlySpendTrendFilter(filterType);
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

export function formatSpendTrendTooltipTitle(
  filterType: InsightDateFilterType,
  point: SpendTrendPoint,
): string {
  const raw = point.date || point.label;

  if (isMonthDaySpendTrendFilter(filterType)) {
    const date = parseDayKey(raw);
    if (date) {
      return new Intl.DateTimeFormat('en-NG', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }
  }

  if (isYearMonthSpendTrendFilter(filterType)) {
    const date = parseMonthKey(raw);
    if (date) {
      return new Intl.DateTimeFormat('en-NG', {
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
  }

  if (isHourlySpendTrendFilter(filterType) && point.date) {
    const match = point.date.match(/(\d{2}):00$/);
    if (match) {
      const hour = Number(match[1]);
      if (hour >= 0 && hour < 24) {
        return formatHourLabel(hour);
      }
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

export function buildSpendTrendAxis(filter: InsightDateFilterValue): {
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
    default:
      break;
  }

  return { keys, labels };
}

function resolvePointIndex(
  filterType: InsightDateFilterType,
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
    const index = axisKeys.findIndex(
      (axisKey) => axisKey.startsWith(dayPrefix) || axisKey === dayPrefix,
    );
    if (index >= 0) {
      return index;
    }
  }

  const monthPrefix = key.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(monthPrefix)) {
    const index = axisKeys.findIndex(
      (axisKey) => axisKey.startsWith(monthPrefix) || axisKey === monthPrefix,
    );
    if (index >= 0) {
      return index;
    }
  }

  return null;
}

export function orderSpendTrendBucketKey(
  createdAt: string,
  filterType: InsightDateFilterType,
): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (isHourlySpendTrendFilter(filterType)) {
    return formatHourKey(date, date.getHours());
  }

  if (isYearMonthSpendTrendFilter(filterType)) {
    return formatMonthKey(date);
  }

  return formatDayKey(date);
}

export function fillSpendTrendPoints(
  filter: InsightDateFilterValue,
  rawPoints: SpendTrendPoint[],
): SpendTrendPoint[] {
  const { keys, labels } = buildSpendTrendAxis(filter);

  if (!keys.length) {
    return rawPoints.map((point) => ({
      ...point,
      label: point.label || point.date || '',
    }));
  }

  const merged = new Map<number, SpendTrendPoint>();

  for (const point of rawPoints) {
    const index = resolvePointIndex(filter.filterType, point.date || point.label, keys);
    if (index == null) {
      continue;
    }

    const existing = merged.get(index);
    if (existing) {
      existing.totalSpend += point.totalSpend;
      existing.orderCount += point.orderCount;
    } else {
      merged.set(index, {
        label: labels[index] ?? keys[index] ?? point.label,
        date: keys[index] ?? point.date,
        totalSpend: point.totalSpend,
        orderCount: point.orderCount,
      });
    }
  }

  return keys.map((axisKey, index) => {
    const hit = merged.get(index);
    return {
      label: labels[index] ?? axisKey,
      date: axisKey,
      totalSpend: hit?.totalSpend ?? 0,
      orderCount: hit?.orderCount ?? 0,
    };
  });
}

export function spendTrendHasActivity(points: SpendTrendPoint[]) {
  return points.some((point) => point.totalSpend > 0 || point.orderCount > 0);
}

/** @deprecated Use SpendTrendPoint */
export type DailySpendPoint = SpendTrendPoint;
