import { RepaymentStatus } from '../credit/enum/repayment.enum';
import type { RepaymentSchedule } from '../credit/schema/repaymentSchedule.schema';

/** Principal still owed on a single repayment schedule line. */
export function getSchedulePrincipalRemainingKobo(
  schedule: Pick<
    RepaymentSchedule,
    'status' | 'paidAmountKobo' | 'principalAmountKobo' | 'interestAmountKobo'
  >,
): number {
  if (schedule.status === RepaymentStatus.PAID) {
    return 0;
  }

  const paid = schedule.paidAmountKobo || 0;
  if (paid <= 0) {
    return schedule.principalAmountKobo;
  }

  // Payments clear interest before principal on a schedule line.
  const interestPaid = Math.min(schedule.interestAmountKobo, paid);
  const principalPaid = Math.min(
    schedule.principalAmountKobo,
    Math.max(0, paid - interestPaid),
  );

  return Math.max(0, schedule.principalAmountKobo - principalPaid);
}

export function sumPrincipalRemainingKobo(
  schedules: Array<
    Pick<
      RepaymentSchedule,
      'status' | 'paidAmountKobo' | 'principalAmountKobo' | 'interestAmountKobo'
    >
  >,
): number {
  return schedules.reduce(
    (sum, schedule) => sum + getSchedulePrincipalRemainingKobo(schedule),
    0,
  );
}
