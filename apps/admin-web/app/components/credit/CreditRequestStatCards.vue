<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_REQUEST_STAT_CARDS } from '~/lib/credit-constants';
import type { CreditRequestStats } from '~/types/credit';

const props = defineProps<{
  stats: CreditRequestStats;
  activeStatus: string | null;
}>();

const emit = defineEmits<{
  filterStatus: [status: string | null];
}>();

function displayValue(key: string) {
  if (key === 'credit-in-use') {
    return formatCreditFromKobo(props.stats.totalCreditInUseKobo);
  }
  if (key === 'all') return formatDashboardNumber(props.stats.totalRequests);
  if (key === 'pending') return formatDashboardNumber(props.stats.totalPendingRequests);
  if (key === 'approved') return formatDashboardNumber(props.stats.totalApprovedRequests);
  if (key === 'rejected') return formatDashboardNumber(props.stats.totalRejectedRequests);
  if (key === 'overdue') return formatDashboardNumber(props.stats.totalOverdueAccounts);
  return '0';
}

function isActive(key: string) {
  if (key === 'all' || key === 'credit-in-use' || key === 'overdue') return false;
  if (!props.activeStatus) return false;
  return props.activeStatus === key;
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
    <button
      v-for="item in CREDIT_REQUEST_STAT_CARDS"
      :key="item.key"
      type="button"
      class="w-full min-w-0 text-left"
      :class="item.key === 'credit-in-use' || item.key === 'overdue' ? 'pointer-events-none' : ''"
      @click="
        item.key !== 'credit-in-use' &&
          item.key !== 'overdue' &&
          emit('filterStatus', item.key === 'all' ? null : item.key)
      "
    >
      <StatCard
        :label="item.label"
        :value="displayValue(item.key)"
        :active="isActive(item.key)"
        class="h-full w-full capitalize"
        :class="item.key !== 'credit-in-use' && item.key !== 'overdue' ? 'cursor-pointer' : ''"
      />
    </button>
  </div>
</template>
