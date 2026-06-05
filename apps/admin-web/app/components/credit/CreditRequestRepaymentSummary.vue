<script setup lang="ts">
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { formatCreditFromKobo } from '~/lib/credit-money';
import type { LegacyCreditRequestRow } from '~/types/credit';

const props = defineProps<{
  credit: LegacyCreditRequestRow;
}>();
</script>

<template>
  <CreditPanelCard title="Repayment summary">
    <div class="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Principal</p>
        <p class="text-sm font-semibold text-grey-900">
          {{ formatCreditFromKobo(credit.approvedAmountKobo ?? credit.requestedAmountKobo) }}
        </p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Total interest</p>
        <p class="text-sm font-semibold text-error-600">
          + {{ formatCreditFromKobo(credit.totalInterestAmountKobo) }}
        </p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Total repayment</p>
        <p class="text-sm font-semibold text-grey-900">
          {{ formatCreditFromKobo(credit.totalRepaymentAmountKobo) }}
        </p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Frequency</p>
        <p class="text-sm font-medium capitalize text-grey-800">{{ credit.repaymentFrequency || '—' }}</p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Duration</p>
        <p class="text-sm font-medium text-grey-800">{{ credit.repaymentDuration ?? '—' }}</p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Interest rate</p>
        <p class="text-sm font-medium text-grey-800">{{ credit.interestRate ?? '—' }}%</p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Grace period</p>
        <p class="text-sm font-medium text-grey-800">
          {{ credit.gracePeriodDays != null ? `${credit.gracePeriodDays} day(s)` : '—' }}
        </p>
      </div>
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-grey-500">Overdue rate</p>
        <p class="text-sm font-medium text-grey-800">
          {{ credit.overdueChargeRate != null ? `${credit.overdueChargeRate}%` : '—' }}
        </p>
      </div>
    </div>
  </CreditPanelCard>
</template>
