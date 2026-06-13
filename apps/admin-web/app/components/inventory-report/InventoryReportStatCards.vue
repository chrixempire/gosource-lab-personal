<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import type { InventoryMovementSummary } from '~/types/inventory-report';

const props = defineProps<{
  summary: InventoryMovementSummary;
}>();

const cards = computed(() => [
  {
    key: 'sold',
    label: 'Total stock sold',
    value: formatDashboardNumber(props.summary.totalDeductedQuantity),
  },
  {
    key: 'added',
    label: 'Total stock added',
    value: formatDashboardNumber(props.summary.totalAddedQuantity),
  },
  {
    key: 'low-stock',
    label: 'Low stock items',
    value: formatDashboardNumber(props.summary.totalLowStockItems),
  },
]);
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
    <StatCard
      v-for="card in cards"
      :key="card.key"
      :label="card.label"
      :value="card.value"
      class="bg-white"
    />
  </div>
</template>
