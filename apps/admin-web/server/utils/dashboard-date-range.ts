const DASHBOARD_TIMEZONE = 'Africa/Lagos';

type DateRangeQuery = {
  filterType?: string;
  startDate?: string;
  endDate?: string;
};

function lagosYmd(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
  };
}

function lagosLocalToUtcIso(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) {
  // Lagos is UTC+1 year-round.
  return new Date(Date.UTC(year, month - 1, day, hour - 1, minute, second, millisecond)).toISOString();
}

function startOfLagosDay(date: Date) {
  const { year, month, day } = lagosYmd(date);
  return lagosLocalToUtcIso(year, month, day, 0, 0, 0, 0);
}

function endOfLagosDay(date: Date) {
  const { year, month, day } = lagosYmd(date);
  return lagosLocalToUtcIso(year, month, day, 23, 59, 59, 999);
}

function addLagosDays(date: Date, days: number) {
  const next = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  return next;
}

function startOfLagosWeek(date: Date) {
  const { year, month, day } = lagosYmd(date);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: DASHBOARD_TIMEZONE,
    weekday: 'short',
  }).format(date);
  const offsets: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const offset = offsets[weekday] ?? 0;
  const start = addLagosDays(date, -offset);
  return startOfLagosDay(start);
}

function endOfLagosWeek(date: Date) {
  const startIso = startOfLagosWeek(date);
  const end = addLagosDays(new Date(startIso), 6);
  return endOfLagosDay(end);
}

function startOfLagosMonth(date: Date) {
  const { year, month } = lagosYmd(date);
  return lagosLocalToUtcIso(year, month, 1, 0, 0, 0, 0);
}

function endOfLagosMonth(date: Date) {
  const { year, month } = lagosYmd(date);
  const probe = lagosLocalToUtcIso(year, month + 1, 0, 23, 59, 59, 999);
  return probe;
}

function startOfLagosYear(date: Date) {
  const { year } = lagosYmd(date);
  return lagosLocalToUtcIso(year, 1, 1, 0, 0, 0, 0);
}

function endOfLagosYear(date: Date) {
  const { year } = lagosYmd(date);
  return lagosLocalToUtcIso(year, 12, 31, 23, 59, 59, 999);
}

function shiftLagosMonths(date: Date, months: number) {
  const { year, month, day } = lagosYmd(date);
  const shifted = new Date(Date.UTC(year, month - 1 + months, Math.min(day, 28)));
  return shifted;
}

function shiftLagosYears(date: Date, years: number) {
  const { year, month, day } = lagosYmd(date);
  return new Date(Date.UTC(year + years, month - 1, day));
}

/** Maps dashboard filter presets to purchase-order createdAt range query params. */
export function resolveDashboardPurchaseOrderDateRange(
  query: DateRangeQuery,
): { startDate?: string; endDate?: string } | null {
  const filterType = query.filterType ?? 'current_date';
  const now = new Date();

  if (filterType === 'all_time') {
    return null;
  }

  if (filterType === 'custom_range') {
    if (!query.startDate || !query.endDate) {
      return null;
    }

    return {
      startDate: query.startDate,
      endDate: query.endDate,
    };
  }

  switch (filterType) {
    case 'current_date':
      return { startDate: startOfLagosDay(now), endDate: endOfLagosDay(now) };
    case 'yesterday': {
      const yesterday = addLagosDays(now, -1);
      return { startDate: startOfLagosDay(yesterday), endDate: endOfLagosDay(yesterday) };
    }
    case 'this_week':
      return { startDate: startOfLagosWeek(now), endDate: endOfLagosWeek(now) };
    case 'last_week': {
      const lastWeek = addLagosDays(now, -7);
      return { startDate: startOfLagosWeek(lastWeek), endDate: endOfLagosWeek(lastWeek) };
    }
    case 'this_month':
      return { startDate: startOfLagosMonth(now), endDate: endOfLagosMonth(now) };
    case 'last_month': {
      const lastMonth = shiftLagosMonths(now, -1);
      return { startDate: startOfLagosMonth(lastMonth), endDate: endOfLagosMonth(lastMonth) };
    }
    case 'this_year':
      return { startDate: startOfLagosYear(now), endDate: endOfLagosYear(now) };
    case 'last_year': {
      const lastYear = shiftLagosYears(now, -1);
      return { startDate: startOfLagosYear(lastYear), endDate: endOfLagosYear(lastYear) };
    }
    default:
      return { startDate: startOfLagosDay(now), endDate: endOfLagosDay(now) };
  }
}
