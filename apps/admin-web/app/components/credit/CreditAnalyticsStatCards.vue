<script setup lang="ts">
import { StatCard, cn } from '@gosource/ui';
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
import { CREDIT_ANALYTICS_STAT_CARDS } from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import type { CreditAnalyticsSummary } from '~/lib/credit-api';

const props = defineProps<{
  summary: CreditAnalyticsSummary;
  loading?: boolean;
}>();

function displayValue(key: (typeof CREDIT_ANALYTICS_STAT_CARDS)[number]['key']) {
  if (key === 'disbursed') {
    return formatCreditFromKobo(props.summary.totalCreditDisbursedKobo);
  }
  if (key === 'outstanding') {
    return formatCreditFromKobo(props.summary.totalCreditOutstandingKobo);
  }
  if (key === 'active-users') {
    return formatDashboardNumber(props.summary.activeCreditUsers);
  }
  return formatCreditFromKobo(props.summary.totalPaidRepaymentsKobo);
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
    <template v-if="loading">
      <div
        v-for="index in 4"
        :key="`analytics-stat-skeleton-${index}`"
        class="h-[8.5rem] animate-pulse rounded-xl border border-grey-50 bg-grey-55"
      />
    </template>
    <template v-else>
      <StatCard
        v-for="card in CREDIT_ANALYTICS_STAT_CARDS"
        :key="card.key"
        :label="card.label"
        :value="displayValue(card.key)"
        class="h-full w-full"
      >
        <template #label>
          <span class="text-xs font-semibold uppercase tracking-wide text-grey-500">
            {{ card.label }}
          </span>
        </template>
        <div class="mt-3 flex items-center gap-1.5">
          <span
            :class="
              cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                card.trend.isRise
                  ? 'bg-success-75 text-success-700'
                  : 'bg-negative-50 text-negative-500',
              )
            "
          >
            <ArrowUp v-if="card.trend.isRise" class="size-3" />
            <ArrowDown v-else class="size-3" />
            {{ card.trend.change }}
          </span>
          <span
            :class="
              cn(
                'text-[10px] font-medium',
                card.trend.isRise ? 'text-success-700' : 'text-negative-500',
              )
            "
          >
            {{ card.trend.period }}
          </span>
        </div>
      </StatCard>
    </template>
  </div>
</template>
