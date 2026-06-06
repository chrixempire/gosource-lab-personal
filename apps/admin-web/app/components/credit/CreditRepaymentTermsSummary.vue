<script setup lang="ts">
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import {
  repaymentFrequencyCycleLabel,
  repaymentFrequencyDurationLabel,
} from '~/lib/credit-approve';

const props = defineProps<{
  principalAmount: number;
  totalInterestAmount: number;
  totalRepayment: number;
  installmentAmount: number;
  businessName: string;
  repaymentFrequency: string;
  repaymentDuration: number;
  interestRate: number;
  gracePeriodDays?: number;
  overdueChargeRate?: number;
}>();
</script>

<template>
  <div class="space-y-4 rounded-xl bg-primary-50 p-6">
    <p class="text-sm font-medium text-grey-900">Repayment terms summary</p>

    <div class="grid grid-cols-2 gap-x-8 gap-y-4">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Principal</p>
        <p class="font-semibold text-grey-900">
          {{ formatDashboardCurrency(props.principalAmount) }}
        </p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Total interest</p>
        <p class="font-semibold text-error-600">
          + {{ formatDashboardCurrency(props.totalInterestAmount) }}
        </p>
      </div>
      <div class="space-y-1 border-t border-grey-100 pt-3">
        <p class="text-xs uppercase tracking-wide text-grey-500">Total repayment</p>
        <p class="text-lg font-bold text-grey-900">
          {{ formatDashboardCurrency(props.totalRepayment) }}
        </p>
      </div>
      <div class="space-y-1 border-t border-grey-100 pt-3">
        <p class="text-xs uppercase tracking-wide text-grey-500">Installment</p>
        <p class="font-semibold text-grey-900">
          {{ formatDashboardCurrency(props.installmentAmount) }}
          <span class="text-sm font-normal text-grey-500">
            / {{ repaymentFrequencyCycleLabel(props.repaymentFrequency) }}
          </span>
        </p>
      </div>
      <div class="space-y-1 border-t border-grey-100 pt-3">
        <p class="text-xs uppercase tracking-wide text-grey-500">Grace period</p>
        <p class="font-semibold text-grey-900">
          {{ props.gracePeriodDays ? `${props.gracePeriodDays} day(s)` : 'N/A' }}
        </p>
      </div>
      <div class="space-y-1 border-t border-grey-100 pt-3">
        <p class="text-xs uppercase tracking-wide text-grey-500">Overdue rate</p>
        <p class="font-semibold text-grey-900">
          {{ props.overdueChargeRate ? `${props.overdueChargeRate}%` : 'N/A' }}
        </p>
      </div>
    </div>

    <p class="border-t border-dashed border-grey-200 pt-3 text-[13px] leading-relaxed text-grey-600">
      Approve
      <span class="font-medium text-grey-900">{{ formatDashboardCurrency(props.principalAmount) }}</span>
      for
      <span class="font-medium text-grey-900">{{ props.businessName }}</span>
      to be repaid over
      <span class="font-medium text-grey-900">
        {{ props.repaymentDuration }}
        {{ repaymentFrequencyDurationLabel(props.repaymentFrequency, true) }}
      </span>
      at
      <span class="font-medium text-grey-900">{{ props.interestRate }}%</span>
      per {{ repaymentFrequencyCycleLabel(props.repaymentFrequency) }} interest.
    </p>
  </div>
</template>
