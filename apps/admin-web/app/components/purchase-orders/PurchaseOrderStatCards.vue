<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardCurrency, formatDashboardNumber } from '~/lib/dashboard-date';
import { PO_QUICK_STATUS_FILTERS } from '~/lib/purchase-order-constants';
import type { PurchaseOrderListFilters, PurchaseOrderListStats } from '~/types/purchase-orders';

const props = defineProps<{
  filters: PurchaseOrderListFilters;
  stats: PurchaseOrderListStats;
}>();

const emit = defineEmits<{
  filterStatus: [status: string | null];
}>();

const allActive = computed(() => props.filters.status.length === 0);

function isActive(status: string) {
  return props.filters.status.includes(status as PurchaseOrderListFilters['status'][number]);
}

function countForStatus(status: string) {
  if (status === 'pending') {
    return props.stats.pendingCount;
  }
  if (status === 'partial') {
    return props.stats.partialCount;
  }
  if (status === 'complete') {
    return props.stats.completeCount;
  }
  return 0;
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <button type="button" class="w-full min-w-0 text-left" @click="emit('filterStatus', null)">
      <StatCard
        label="All orders"
        :value="formatDashboardNumber(stats.totalDocuments)"
        :active="allActive"
        class="h-full w-full cursor-pointer"
      />
    </button>

    <button
      v-for="status in PO_QUICK_STATUS_FILTERS"
      :key="status.key"
      type="button"
      class="w-full min-w-0 text-left"
      @click="emit('filterStatus', status.key)"
    >
      <StatCard
        :label="status.label"
        :value="formatDashboardNumber(countForStatus(status.key))"
        :active="isActive(status.key)"
        class="h-full w-full cursor-pointer"
      />
    </button>

    <StatCard
      label="Total value"
      :value="formatDashboardCurrency(stats.totalPrice)"
      class="h-full w-full"
    />
    <StatCard
      label="Logistics"
      :value="formatDashboardCurrency(stats.totalLogistics)"
      class="h-full w-full"
    />
  </div>
</template>
