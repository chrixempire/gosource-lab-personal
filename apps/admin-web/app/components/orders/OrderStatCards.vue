<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { ORDER_QUICK_STATUS_FILTERS } from '~/lib/order-constants';
import type { AdminOrderListItem, OrderListFilters } from '~/types/orders';

const props = defineProps<{
  filters: OrderListFilters;
  orders: AdminOrderListItem[];
  totalCount: number;
}>();

const emit = defineEmits<{
  filterStatus: [status: string | null];
}>();


function countByStatus(status: string) {
  return props.orders.filter((order) => order.status === status).length;
}

function isActive(status: string) {
  return props.filters.status.includes(status);
}

const allActive = computed(() => props.filters.status.length === 0);
</script>

<template>
  <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <button
      type="button"
      class="w-full min-w-0 text-left"
      @click="emit('filterStatus', null)"
    >
      <StatCard
        label="All orders"
        :value="formatDashboardNumber(totalCount)"
        :active="allActive"
        class="h-full w-full cursor-pointer"
      />
    </button>

    <button
      v-for="status in ORDER_QUICK_STATUS_FILTERS"
      :key="status.key"
      type="button"
      class="w-full min-w-0 text-left"
      @click="emit('filterStatus', status.key)"
    >
      <StatCard
        :label="status.label"
        :value="formatDashboardNumber(countByStatus(status.key))"
        hint="On this page"
        :active="isActive(status.key)"
        class="h-full w-full cursor-pointer"
      />
    </button>
  </div>
</template>
