<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_REPAYMENT_STAT_CARDS } from '~/lib/credit-constants';
import type { RepaymentListSummary } from '~/types/credit';

const props = defineProps<{ summary: RepaymentListSummary }>();

function displayValue(key: string) {
  if (key === 'total-credit') {
    return formatCreditFromKobo(props.summary.totalCreditDisbursedKobo);
  }
  if (key === 'total-repayments') {
    return formatCreditFromKobo(props.summary.totalPaidRepaymentsKobo);
  }
  if (key === 'outstanding') {
    return formatCreditFromKobo(props.summary.outstandingRepaymentsKobo);
  }
  if (key === 'overdue') {
    return formatDashboardNumber(props.summary.overduePaymentsCount);
  }
  if (key === 'due-week') {
    return formatDashboardNumber(props.summary.dueThisWeekCount);
  }
  return '—';
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
    <StatCard
      v-for="item in CREDIT_REPAYMENT_STAT_CARDS"
      :key="item.key"
      :label="item.label"
      :value="displayValue(item.key)"
      class="h-full w-full capitalize"
    />
  </div>
</template>
