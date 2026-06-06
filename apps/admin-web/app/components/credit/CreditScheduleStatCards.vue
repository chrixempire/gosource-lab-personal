<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { formatCreditFromKobo } from '~/lib/credit-money';
import type { OverdueRepaymentSummary, RepaymentSchedulesSummary } from '~/types/credit';

const props = defineProps<{
  variant: 'schedules' | 'overdue';
  schedulesSummary?: RepaymentSchedulesSummary;
  overdueSummary?: OverdueRepaymentSummary;
}>();

const scheduleCards = computed(() => {
  const s = props.schedulesSummary;
  if (!s) return [];
  return [
    { label: 'Total installments', value: formatDashboardNumber(s.totalRepayments) },
    { label: 'Scheduled amount', value: formatCreditFromKobo(s.totalScheduledAmountKobo) },
    { label: 'Remaining', value: formatCreditFromKobo(s.totalRemainingAmountKobo) },
    { label: 'Overdue count', value: formatDashboardNumber(s.overdueCount) },
    { label: 'Collection rate', value: `${s.collectionRate}%` },
  ];
});

const overdueCards = computed(() => {
  const s = props.overdueSummary;
  if (!s) return [];
  return [
    { label: 'Overdue accounts', value: formatDashboardNumber(s.totalOverdueCount) },
    { label: 'Overdue amount', value: formatCreditFromKobo(s.totalOverdueAmountKobo) },
    { label: 'Avg. days overdue', value: formatDashboardNumber(s.averageDaysOverdue) },
  ];
});

const cards = computed(() =>
  props.variant === 'overdue' ? overdueCards.value : scheduleCards.value,
);
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
    <StatCard
      v-for="card in cards"
      :key="card.label"
      :label="card.label"
      :value="card.value"
    />
  </div>
</template>
