<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';
import {
  Checkbox,
  TableBody,
  TableCell,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
} from '@gosource/ui';
import { computed, ref } from 'vue';
import OrderActionsMenu from '~/components/orders/OrderActionsMenu.vue';
import OrderPaymentStatusSelect from '~/components/orders/OrderPaymentStatusSelect.vue';
import OrdersListFooter from '~/components/orders/OrdersListFooter.vue';
import OrdersListTableSkeleton from '~/components/orders/OrdersListTableSkeleton.vue';
import OrderStatusSelect from '~/components/orders/OrderStatusSelect.vue';
import {
  ORDER_LIST_PANEL_CLASS,
  ORDER_TABLE_GRID_TEMPLATE,
} from '~/lib/orders-table-layout';
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
  <TableShell :class="[ORDER_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
      <TableHeadRow
        :style="{ gridTemplateColumns: ORDER_TABLE_GRID_TEMPLATE }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell class="flex items-center justify-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all loaded orders"
            @update:model-value="toggleAll"
          />
        </TableCell>
        <TableCell>Order</TableCell>
        <TableCell>Item</TableCell>
        <TableCell>Payment method</TableCell>
        <TableCell>Payment status</TableCell>
        <TableCell>Customer</TableCell>
        <TableCell>Status</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
      <OrdersListTableSkeleton :row-count="10" />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="order in orders"
        :key="order.id"
        class="cursor-pointer transition-colors hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: ORDER_TABLE_GRID_TEMPLATE }"
        @click="emit('rowClick', order)"
      >
          <TableCell class="flex items-center justify-center" @click.stop>
            <Checkbox
              :model-value="selectedSet.has(order.id)"
              :aria-label="`Select order ${order.referenceLabel}`"
              @update:model-value="toggleRow(order.id, $event)"
            />
          </TableCell>

          <TableCell>
            <div class="flex min-w-0 flex-col gap-0.5">
              <p class="truncate text-sm font-semibold text-grey-900">
                {{ order.referenceLabel }}
              </p>
              <p class="text-sm text-grey-300">{{ order.createdLabel }}</p>
            </div>
          </TableCell>

          <TableCell>
            <div class="flex min-w-0 flex-col gap-0.5">
              <p class="text-sm font-semibold text-grey-900">{{ order.totalLabel }}</p>
              <p class="text-sm text-grey-300">{{ order.itemCountLabel }}</p>
            </div>
          </TableCell>

          <TableCell>
            <p class="text-sm text-grey-800">{{ order.paymentMethodLabel }}</p>
          </TableCell>

          <TableCell @click.stop>
            <OrderPaymentStatusSelect
              :order-id="order.id"
              :status="order.paymentStatus"
              :status-label="order.paymentStatusLabel"
              :disabled="updatingOrderId === order.id"
              @change="emit('updatePaymentStatus', order.id, $event)"
            />
          </TableCell>

          <TableCell>
            <p class="truncate text-sm text-grey-800">{{ order.customerName }}</p>
          </TableCell>

          <TableCell @click.stop>
            <OrderStatusSelect
              :order-id="order.id"
              :status="order.status"
              :status-label="order.statusLabel"
              :disabled="updatingOrderId === order.id"
              @change="emit('updateOrderStatus', order.id, $event)"
            />
          </TableCell>

          <TableCell class="flex items-center justify-end">
            <OrderActionsMenu
              :order="order"
              @view="emit('rowClick', order)"
              @download="emit('download', order)"
              @cancel="emit('cancel', order)"
            />
          </TableCell>
      </TableRow>
      <div ref="sentinelRef" class="h-px w-full shrink-0" aria-hidden="true" />
    </TableBody>

    <OrdersListFooter
      :has-items="orders.length > 0"
      :has-more="hasMore"
      :loading-more="loadingMore"
    />
  </TableShell>
</template>
