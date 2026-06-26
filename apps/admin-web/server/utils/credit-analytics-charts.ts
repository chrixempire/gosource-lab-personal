import type { H3Event } from 'h3';
import {
  fetchLegacyCreditRequests,
  fetchLegacyPaymentHistory,
  fetchLegacyRepaymentSchedules,
} from './credit-analytics-legacy-fetch';

const MAX_REQUEST_PAGES = 3;
const MAX_SCHEDULE_PAGES = 5;
const MAX_PAYMENT_PAGES = 3;

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

export type CreditAnalyticsChartsPayload = {
  creditUsage: {
    labels: string[];
    valuesNaira: number[];
    year: number;
  };
  repaymentPerformance: {
    paidEarly: number;
    paidOnTime: number;
    defaulted: number;
    late: number;
  };
};

type LegacySchedule = Record<string, unknown>;

function startOfDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function readEventDate(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (!value) continue;
    const time = new Date(String(value)).getTime();
    if (!Number.isNaN(time)) return time;
  }
  return null;
}

/** Monthly approved credit disbursed (NGN) for the current calendar year. */
export function buildMonthlyCreditUsage(requests: Record<string, unknown>[]) {
  const year = new Date().getFullYear();
  const valuesNaira = Array.from({ length: 12 }, () => 0);

  for (const row of requests) {
    const status = String(row.status ?? '').toLowerCase();
    if (!['approved', 'completed'].includes(status)) continue;

    const amountKobo = Number(row.approvedAmountKobo) || 0;
    if (amountKobo <= 0) continue;

    const eventTime = readEventDate(row, ['approvedDate', 'updatedAt', 'createdAt']);
    if (eventTime == null) continue;

    const eventDate = new Date(eventTime);
    if (eventDate.getFullYear() !== year) continue;

    const month = eventDate.getMonth();
    valuesNaira[month] = (valuesNaira[month] ?? 0) + amountKobo / 100;
  }

  return {
    labels: [...MONTH_LABELS],
    valuesNaira,
    year,
  };
}

function categorizeRepaymentSchedule(schedule: LegacySchedule) {
  const status = String(schedule.status ?? '').toUpperCase();
  if (status === 'CANCELLED') return null;

  const dueTime = readEventDate(schedule, ['dueDate']);
  const graceTime =
    readEventDate(schedule, ['gracePeriodEnd']) ?? dueTime ?? null;
  if (dueTime == null || graceTime == null) return null;

  const dueDay = startOfDay(dueTime);
  const graceDay = startOfDay(graceTime);
  const now = Date.now();

  if (status === 'PAID') {
    const paidTime = readEventDate(schedule, ['paidDate']) ?? dueTime;
    const paidDay = startOfDay(paidTime);

    if (paidDay < dueDay) return 'paidEarly';
    if (paidDay <= graceDay) return 'paidOnTime';
    return 'late';
  }

  if (status === 'OVERDUE' || schedule.isOverdue === true) {
    return 'defaulted';
  }

  if (status === 'PARTIALLY_PAID' && now > graceDay) {
    return 'late';
  }

  if (status === 'PENDING' && now > graceDay) {
    return 'defaulted';
  }

  return null;
}

export function buildRepaymentPerformanceBreakdown(schedules: LegacySchedule[]) {
  const counts = {
    paidEarly: 0,
    paidOnTime: 0,
    defaulted: 0,
    late: 0,
  };

  for (const schedule of schedules) {
    const category = categorizeRepaymentSchedule(schedule);
    if (!category) continue;
    counts[category] += 1;
  }

  return counts;
}

export async function buildCreditAnalyticsCharts(
  event: H3Event,
): Promise<CreditAnalyticsChartsPayload> {
  const [requests, schedules, payments] = await Promise.all([
    fetchLegacyCreditRequests(event, MAX_REQUEST_PAGES),
    fetchLegacyRepaymentSchedules(event, MAX_SCHEDULE_PAGES),
    fetchLegacyPaymentHistory(event, MAX_PAYMENT_PAGES),
  ]);

  const creditUsage = buildMonthlyCreditUsage(requests);

  // If disbursement data is sparse, fall back to completed payments by month.
  if (creditUsage.valuesNaira.every((value) => value === 0) && payments.length > 0) {
    const year = new Date().getFullYear();
    const valuesNaira = Array.from({ length: 12 }, () => 0);

    for (const row of payments) {
      const status = String(row.status ?? '').toUpperCase();
      if (status !== 'COMPLETED') continue;

      const amountKobo = Number(row.amountKobo) || 0;
      if (amountKobo <= 0) continue;

      const eventTime = readEventDate(row, ['approvedAt', 'updatedAt', 'createdAt']);
      if (eventTime == null) continue;

      const eventDate = new Date(eventTime);
      if (eventDate.getFullYear() !== year) continue;

      const month = eventDate.getMonth();
      valuesNaira[month] = (valuesNaira[month] ?? 0) + amountKobo / 100;
    }

    creditUsage.valuesNaira = valuesNaira;
  }

  return {
    creditUsage,
    repaymentPerformance: buildRepaymentPerformanceBreakdown(schedules),
  };
}
