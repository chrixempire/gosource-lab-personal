import { koboToNaira } from '~/lib/credit-money';
import type { CreditRequestType } from '~/types/credit';

export type CreditRepaymentFrequencyOption = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export function creditApproveFrequencyOptions(requestType: CreditRequestType | string | undefined) {
  if (requestType === 'topup') {
    return [{ value: 'MONTHLY' as const, label: 'Monthly', snippet: 'Repayment is monthly for the set duration.' }];
  }
  return [
    { value: 'WEEKLY' as const, label: 'Weekly', snippet: 'Repayments occur weekly, based on the set duration.' },
    { value: 'MONTHLY' as const, label: 'Monthly', snippet: 'Repayment is monthly for the set duration.' },
    {
      value: 'CUSTOM' as const,
      label: 'Custom',
      snippet: "Set a repayment term that doesn't follow a weekly or monthly cycle.",
    },
  ];
}

export function computeCreditApproveTotals(input: {
  requestedAmountKobo: number;
  repaymentFrequency: CreditRepaymentFrequencyOption | string;
  repaymentDuration: number;
  interestRate: number;
  customFrequencyDays?: number;
}) {
  const principalAmount = koboToNaira(input.requestedAmountKobo);
  const dailyRatePercent = input.interestRate / 30;
  const frequencyDays =
    input.repaymentFrequency === 'WEEKLY'
      ? 7
      : input.repaymentFrequency === 'MONTHLY'
        ? 30
        : Number(input.customFrequencyDays) || 0;
  const totalDays = frequencyDays * input.repaymentDuration;
  const totalInterestAmount = Math.round((principalAmount * dailyRatePercent * totalDays) / 100);
  const totalRepayment = principalAmount + totalInterestAmount;
  const installmentAmount =
    input.repaymentDuration > 0 ? Math.round(totalRepayment / input.repaymentDuration) : 0;

  return { principalAmount, totalInterestAmount, totalRepayment, installmentAmount };
}

export function repaymentFrequencyCycleLabel(frequency: string | undefined) {
  if (frequency === 'MONTHLY') return 'month';
  if (frequency === 'WEEKLY') return 'week';
  return 'cycle';
}

export function repaymentFrequencyDurationLabel(frequency: string | undefined, plural = false) {
  if (frequency === 'MONTHLY') return plural ? 'month(s)' : 'month';
  if (frequency === 'WEEKLY') return plural ? 'week(s)' : 'week';
  return plural ? 'cycle(s)' : 'cycle';
}
