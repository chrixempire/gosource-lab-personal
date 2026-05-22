<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import PurchaseOrderCard from '~/components/purchase-orders/PurchaseOrderCard.vue';
import type { AdminPurchaseOrderListItem } from '~/types/purchase-orders';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  orders: AdminPurchaseOrderListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyOrderId?: string | null;
  loadingOrderId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [order: AdminPurchaseOrderListItem];
  viewInvoice: [order: AdminPurchaseOrderListItem];
  receive: [order: AdminPurchaseOrderListItem];
  edit: [order: AdminPurchaseOrderListItem];
  sendInvoice: [order: AdminPurchaseOrderListItem];
  download: [order: AdminPurchaseOrderListItem];
  cancelRemaining: [order: AdminPurchaseOrderListItem];
  deleteOrder: [order: AdminPurchaseOrderListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

function toggleSelect(orderId: string, selected: boolean) {
  const next = new Set(selectedIds.value);
  if (selected) {
    next.add(orderId);
  } else {
    next.delete(orderId);
  }
  selectedIds.value = [...next];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <div
        v-for="index in 6"
        :key="index"
        class="h-56 animate-pulse rounded-[24px] border border-grey-50 bg-grey-55"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <PurchaseOrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        :selected="selectedSet.has(order.id)"
        :busy="busyOrderId === order.id"
        :loading="loadingOrderId === order.id"
        @row-click="emit('rowClick', order)"
        @toggle-select="toggleSelect"
        @view-invoice="emit('viewInvoice', order)"
        @receive="emit('receive', order)"
        @edit="emit('edit', order)"
        @send-invoice="emit('sendInvoice', order)"
        @download="emit('download', order)"
        @cancel-remaining="emit('cancelRemaining', order)"
        @delete-order="emit('deleteOrder', order)"
      />
    </div>

    <PaginationBar
      v-if="!loading && orders.length > 0"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total-items="meta.total"
      :page-size="meta.limit"
      :has-next-page="meta.hasNext"
      :has-prev-page="meta.hasPrev"
      @change="emit('page', $event)"
      @page-size-change="emit('pageSize', $event)"
    />
  </div>
</template>
