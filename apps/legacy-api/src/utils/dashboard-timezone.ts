import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const DEFAULT_DASHBOARD_TIMEZONE = 'Africa/Lagos';

/** IANA timezone for dashboard date presets (Today, This week, etc.). */
export function getDashboardTimezone(): string {
  const configured = process.env.DASHBOARD_TIMEZONE?.trim();
  return configured || DEFAULT_DASHBOARD_TIMEZONE;
}

function inDashboardZone(date: Date, timeZone: string): Date {
  return toZonedTime(date, timeZone);
}

/** Convert a zoned calendar instant to UTC for MongoDB range queries. */
function toUtc(zonedLocal: Date, timeZone: string): Date {
  return fromZonedTime(zonedLocal, timeZone);
}

export function zonedStartOfDay(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(startOfDay(inDashboardZone(reference, timeZone)), timeZone);
}

export function zonedEndOfDay(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(endOfDay(inDashboardZone(reference, timeZone)), timeZone);
}

export function zonedStartOfWeek(
  reference: Date,
  timeZone = getDashboardTimezone(),
): Date {
  return toUtc(
    startOfWeek(inDashboardZone(reference, timeZone), { weekStartsOn: 1 }),
    timeZone,
  );
}

export function zonedEndOfWeek(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(
    endOfWeek(inDashboardZone(reference, timeZone), { weekStartsOn: 1 }),
    timeZone,
  );
}

export function zonedStartOfMonth(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(startOfMonth(inDashboardZone(reference, timeZone)), timeZone);
}

export function zonedEndOfMonth(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(endOfMonth(inDashboardZone(reference, timeZone)), timeZone);
}

export function zonedStartOfYear(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(startOfYear(inDashboardZone(reference, timeZone)), timeZone);
}

export function zonedEndOfYear(reference: Date, timeZone = getDashboardTimezone()): Date {
  return toUtc(endOfYear(inDashboardZone(reference, timeZone)), timeZone);
}

export function zonedSubDays(reference: Date, days: number, timeZone = getDashboardTimezone()) {
  return toUtc(subDays(inDashboardZone(reference, timeZone), days), timeZone);
}

export function zonedSubWeeks(reference: Date, weeks: number, timeZone = getDashboardTimezone()) {
  return toUtc(subWeeks(inDashboardZone(reference, timeZone), weeks), timeZone);
}

export function zonedSubMonths(
  reference: Date,
  months: number,
  timeZone = getDashboardTimezone(),
) {
  return toUtc(subMonths(inDashboardZone(reference, timeZone), months), timeZone);
}

export function zonedSubYears(reference: Date, years: number, timeZone = getDashboardTimezone()) {
  return toUtc(subYears(inDashboardZone(reference, timeZone), years), timeZone);
}
