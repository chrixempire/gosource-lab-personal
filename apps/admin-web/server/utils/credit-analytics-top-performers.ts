import type { H3Event } from 'h3';
import {
  fetchLegacyCreditRequests,
  fetchLegacyRepaymentSchedules,
} from './credit-analytics-legacy-fetch';

const MAX_REQUEST_PAGES = 3;
const MAX_SCHEDULE_PAGES = 5;

type LegacyBusiness = Record<string, unknown>;
type LegacyCreditAccount = Record<string, unknown>;
type LegacySchedule = Record<string, unknown>;

export type CreditTopPerformerRecord = {
  businessId: string;
  displayName: string;
  accountType: string;
  creditLimitKobo: number;
  creditUsedKobo: number;
  repaymentScore: number;
  status: 'active' | 'inactive';
};

type BusinessAggregate = {
  business: LegacyBusiness;
  creditAccount: LegacyCreditAccount;
  schedules: LegacySchedule[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function businessIdFrom(value: unknown) {
  const record = asRecord(value);
  if (!record) return '';
  return String(record._id ?? record.id ?? '');
}

function businessDisplayName(business: LegacyBusiness) {
  const accountType = String(business.accountType ?? 'business');
  if (accountType === 'individual') {
    return `${business.firstName ?? ''} ${business.lastName ?? ''}`.trim() || '—';
  }
  return String(business.businessName ?? '—');
}

function performerStatus(business: LegacyBusiness, creditAccount: LegacyCreditAccount): 'active' | 'inactive' {
  const accountStatus = String(creditAccount.status ?? 'active').toLowerCase();
  const businessActive = business.active !== false;
  if (!businessActive || accountStatus === 'suspended' || accountStatus === 'closed') {
    return 'inactive';
  }
  return 'active';
}

function isRepaymentOnTime(schedule: LegacySchedule) {
  const status = String(schedule.status ?? '').toUpperCase();
  if (status !== 'PAID') return false;

  const paidDateRaw = schedule.paidDate;
  if (!paidDateRaw) return true;

  const paidAt = new Date(String(paidDateRaw)).getTime();
  if (Number.isNaN(paidAt)) return true;

  const dueAt = new Date(
    String(schedule.gracePeriodEnd ?? schedule.dueDate ?? ''),
  ).getTime();
  if (Number.isNaN(dueAt)) return true;

  return paidAt <= dueAt;
}

/** 0–100 score from installment behaviour and account defaults. */
export function computeRepaymentScore(
  schedules: LegacySchedule[],
  creditAccount: LegacyCreditAccount,
) {
  const evaluated = schedules.filter(
    (row) => String(row.status ?? '').toUpperCase() !== 'CANCELLED',
  );

  if (evaluated.length === 0) {
    const defaultedCounts = Number(creditAccount.defaultedCounts) || 0;
    const totalOverdueKobo = Number(creditAccount.totalOverdueKobo) || 0;
    const base = 100 - defaultedCounts * 12 - (totalOverdueKobo > 0 ? 15 : 0);
    return Math.max(0, Math.min(100, Math.round(base)));
  }

  const totalScheduledKobo = evaluated.reduce(
    (sum, row) => sum + (Number(row.totalAmountKobo) || 0),
    0,
  );
  const totalPaidKobo = evaluated.reduce(
    (sum, row) => sum + (Number(row.paidAmountKobo) || 0),
    0,
  );
  const collectionRate =
    totalScheduledKobo > 0 ? (totalPaidKobo / totalScheduledKobo) * 100 : 100;

  const onTimeCount = evaluated.filter(isRepaymentOnTime).length;
  const onTimeRate = (onTimeCount / evaluated.length) * 100;

  const overdueCount = evaluated.filter((row) => {
    const status = String(row.status ?? '').toUpperCase();
    return status === 'OVERDUE' || row.isOverdue === true;
  }).length;
  const overduePenalty = (overdueCount / evaluated.length) * 25;

  const defaultedCounts = Number(creditAccount.defaultedCounts) || 0;
  const defaultPenalty = Math.min(30, defaultedCounts * 8);

  const raw = collectionRate * 0.45 + onTimeRate * 0.45 - overduePenalty - defaultPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function upsertBusinessAggregate(
  map: Map<string, BusinessAggregate>,
  business: LegacyBusiness,
  creditAccount: LegacyCreditAccount,
) {
  const businessId = businessIdFrom(business);
  if (!businessId) return;

  const limitKobo = Number(creditAccount.limitKobo) || 0;
  if (limitKobo <= 0) return;

  const existing = map.get(businessId);
  const outstandingKobo = Number(creditAccount.outstandingKobo) || 0;
  const existingOutstanding = existing
    ? Number(existing.creditAccount.outstandingKobo) || 0
    : -1;

  if (!existing || outstandingKobo >= existingOutstanding) {
    map.set(businessId, {
      business,
      creditAccount,
      schedules: existing?.schedules ?? [],
    });
  }
}

function attachSchedule(map: Map<string, BusinessAggregate>, schedule: LegacySchedule) {
  const business = asRecord(schedule.business);
  const businessId = businessIdFrom(business);
  if (!businessId) return;

  const existing = map.get(businessId);
  if (existing) {
    existing.schedules.push(schedule);
    return;
  }

  const creditRequest = asRecord(schedule.creditRequest);
  const approvedAmountKobo = Number(creditRequest?.approvedAmountKobo) || 0;
  const remainingKobo = Number(schedule.remainingAmountKobo) || 0;

  map.set(businessId, {
    business,
    creditAccount: {
      limitKobo: approvedAmountKobo,
      outstandingKobo: remainingKobo,
      defaultedCounts: 0,
      totalOverdueKobo: String(schedule.status ?? '').toUpperCase() === 'OVERDUE' ? remainingKobo : 0,
      status: 'active',
    },
    schedules: [schedule],
  });
}

function resolveCreditUsedKobo(creditAccount: LegacyCreditAccount, schedules: LegacySchedule[]) {
  const outstandingKobo = Number(creditAccount.outstandingKobo) || 0;
  if (outstandingKobo > 0) return outstandingKobo;

  return schedules.reduce((sum, row) => sum + (Number(row.remainingAmountKobo) || 0), 0);
}

export async function buildCreditTopPerformers(
  event: H3Event,
  limit: number,
): Promise<CreditTopPerformerRecord[]> {
  const [requests, schedules] = await Promise.all([
    fetchLegacyCreditRequests(event, MAX_REQUEST_PAGES),
    fetchLegacyRepaymentSchedules(event, MAX_SCHEDULE_PAGES),
  ]);

  const byBusiness = new Map<string, BusinessAggregate>();

  for (const row of requests) {
    const status = String(row.status ?? '').toLowerCase();
    if (!['approved', 'completed'].includes(status)) continue;

    const business = asRecord(row.business);
    const creditAccount = asRecord(row.creditAccount);
    if (!business || !creditAccount) continue;

    upsertBusinessAggregate(byBusiness, business, creditAccount);
  }

  for (const schedule of schedules) {
    attachSchedule(byBusiness, schedule);
  }

  const performers = [...byBusiness.entries()]
    .map(([businessId, aggregate]) => {
      const { business, creditAccount, schedules: businessSchedules } = aggregate;
      const limitKobo = Number(creditAccount.limitKobo) || 0;
      const creditUsedKobo = resolveCreditUsedKobo(creditAccount, businessSchedules);
      const totalPaymentsKobo = Number(creditAccount.totalPaymentsKobo) || 0;
      const hasActivity =
        limitKobo > 0 && (creditUsedKobo > 0 || totalPaymentsKobo > 0 || businessSchedules.length > 0);

      if (!hasActivity) return null;

      return {
        businessId,
        displayName: businessDisplayName(business),
        accountType: String(business.accountType ?? 'business'),
        creditLimitKobo: limitKobo,
        creditUsedKobo,
        repaymentScore: computeRepaymentScore(businessSchedules, creditAccount),
        status: performerStatus(business, creditAccount),
      } satisfies CreditTopPerformerRecord;
    })
    .filter((row): row is CreditTopPerformerRecord => row !== null)
    .sort((a, b) => {
      if (b.repaymentScore !== a.repaymentScore) {
        return b.repaymentScore - a.repaymentScore;
      }
      return b.creditUsedKobo - a.creditUsedKobo;
    })
    .slice(0, limit);

  return performers;
}
