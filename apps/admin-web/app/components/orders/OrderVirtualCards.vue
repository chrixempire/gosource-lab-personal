<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual';
import { breakpointsTailwind, useBreakpoints, useIntersectionObserver } from '@vueuse/core';
import { computed, ref } from 'vue';
import { Checkbox } from '@gosource/ui';
import OrderCard from '~/components/orders/OrderCard.vue';
import OrdersCardsSkeleton from '~/components/orders/OrdersCardsSkeleton.vue';
import OrdersListFooter from '~/components/orders/OrdersListFooter.vue';
import { ORDER_CARD_HEIGHT } from '~/lib/order-list';
import { ORDER_LIST_PANEL_CLASS } from '~/lib/orders-table-layout';
import type { AdminOrderListItem, OrderPaymentStatus, OrderStatus } from '~/types/orders';

const props = defineProps<{
  orders: AdminOrderListItem[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  updatingOrderId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  loadMore: [];
  rowClick: [order: AdminOrderListItem];
  updateOrderStatus: [orderId: string, status: OrderStatus];
  updatePaymentStatus: [orderId: string, status: OrderPaymentStatus];
  download: [order: AdminOrderListItem];
  cancel: [order: AdminOrderListItem];
}>();

const sentinelRef = ref<HTMLElement | null>(null);
const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.orders.length === 0) {
    return false;
  }
  const selectedLoaded = props.orders.filter((order) => selectedSet.value.has(order.id)).length;
  if (selectedLoaded === 0) {
    return false;
  }
  if (selectedLoaded === props.orders.length) {
    return true;
  }
  return 'indeterminate';
});

const breakpoints = useBreakpoints(breakpointsTailwind);

const columnCount = computed(() => {
  if (breakpoints.greaterOrEqual('2xl').value) {
    return 4;
  }
  if (breakpoints.greaterOrEqual('xl').value) {
    return 3;
  }
  if (breakpoints.greaterOrEqual('sm').value) {
    return 2;
  }
  return 1;
});

const gridColsClass = computed(() => {
  if (columnCount.value === 4) {
    return 'grid-cols-4';
  }
  if (columnCount.value === 3) {
    return 'grid-cols-3';
  }
  if (columnCount.value === 2) {
    return 'grid-cols-2';
  }
  return 'grid-cols-1';
});

const orderRows = computed(() => {
  const rows: AdminOrderListItem[][] = [];
  const columns = columnCount.value;

  for (let index = 0; index < props.orders.length; index += columns) {
    rows.push(props.orders.slice(index, index + columns));
  }

  return rows;
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const loadedIds = new Set(props.orders.map((order) => order.id));
    selectedIds.value = selectedIds.value.filter((id) => !loadedIds.has(id));
    return;
  }

  const merged = new Set(selectedIds.value);
  for (const order of props.orders) {
    merged.add(order.id);
  }
  selectedIds.value = [...merged];
}

function toggleRow(orderId: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) {
    next.add(orderId);
  } else {
    next.delete(orderId);
  }
  selectedIds.value = [...next];
}

useIntersectionObserver(
  sentinelRef,
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      emit('loadMore');
    }
  },
  { threshold: 0 },
);
</script>

<template>
  <section :class="ORDER_LIST_PANEL_CLASS">
    <div class="border-b border-grey-50 px-4 py-3 sm:px-5">
      <div class="flex items-center gap-3">
        <Checkbox
          :model-value="selectionState"
          aria-label="Select all loaded orders"
          @update:model-value="toggleAll"
        />
        <span class="text-sm font-medium text-grey-700">Select loaded orders</span>
      </div>
    </div>

    <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
      <OrdersCardsSkeleton :row-count="2" />
    </div>

    <div v-else class="p-4 sm:p-5">
      <div
        v-for="(row, rowIndex) in orderRows"
        :key="`order-row-${rowIndex}`"
        class="grid w-full min-w-0 items-stretch gap-4 lg:gap-5"
        :class="[gridColsClass, rowIndex > 0 ? 'mt-4 lg:mt-5' : '']"
      >
        <OrderCard
          v-for="order in row"
          :key="order.id"
          :order="order"
          :updating-order-id="updatingOrderId"
          :selected="selectedSet.has(order.id)"
          @row-click="emit('rowClick', $event)"
          @toggle-selected="toggleRow"
          @update-order-status="(orderId, status) => emit('updateOrderStatus', orderId, status)"
          @update-payment-status="(orderId, status) => emit('updatePaymentStatus', orderId, status)"
          @download="emit('download', $event)"
          @cancel="emit('cancel', $event)"
        />
      </div>
      <div ref="sentinelRef" class="h-px w-full shrink-0" aria-hidden="true" />
    </div>

    <OrdersListFooter
      :has-items="orders.length > 0"
      :has-more="hasMore"
      :loading-more="loadingMore"
    />
  </section>
</template>
