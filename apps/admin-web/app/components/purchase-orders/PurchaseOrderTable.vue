<script setup lang="ts">
import {
  Checkbox,
  PaginationBar,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import PurchaseOrderActionsMenu from '~/components/purchase-orders/PurchaseOrderActionsMenu.vue';
import { purchaseOrderStatusVariant } from '~/lib/purchase-order-constants';
import { PO_LIST_PANEL_CLASS, PO_TABLE_GRID_TEMPLATE } from '~/lib/purchase-orders-table-layout';
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

const skeletonColumns = [
  { kind: 'line' as const, lineClass: 'w-5' },
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
  { kind: 'stack' as const, lineClass: 'w-24', sublineClass: 'w-16' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-8' },
];

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
</script>

<template>
  <TableShell :class="[PO_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: PO_TABLE_GRID_TEMPLATE }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all purchase orders on this page"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Order</TableCell>
        <TableCell>Items</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Received</TableCell>
        <TableCell>Expected</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
      <TableSkeleton
        :columns="skeletonColumns"
        :grid-template-columns="PO_TABLE_GRID_TEMPLATE"
        :row-count="10"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="order in orders"
        :key="order.id"
        class="cursor-pointer transition-colors hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: PO_TABLE_GRID_TEMPLATE }"
        @click="emit('rowClick', order)"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(order.id)"
            :aria-label="`Select purchase order ${order.referenceLabel}`"
            @update:model-value="toggleRow(order.id, $event)"
          />
        </TableCell>
        <TableCell>
          <p class="text-sm font-semibold text-grey-900">{{ order.referenceLabel }}</p>
          <p class="mt-0.5 text-xs text-grey-500">{{ order.createdAtLabel }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-900">{{ order.itemsTotalLabel }}</p>
          <p class="mt-0.5 text-xs text-grey-500">{{ order.itemsCount }} products</p>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-800">{{ order.productTypeLabel }}</p>
        </TableCell>
        <TableCell>
          <StatusTag :variant="purchaseOrderStatusVariant(order.status)" size="medium">
            {{ order.statusLabel }}
          </StatusTag>
        </TableCell>
        <TableCell>
          <div class="space-y-1.5">
            <div
              class="h-2.5 overflow-hidden rounded-full"
              :class="
                order.receivePercent > 0 && order.receivePercent < 100
                  ? 'border border-grey-200 bg-grey-55'
                  : order.receivePercent === 100
                    ? 'bg-grey-55'
                  : 'border border-grey-200 bg-grey-200'
              "
            >
              <div
                v-if="order.receivePercent > 0"
                class="h-full rounded-full bg-primary-500 transition-all"
                :style="{ width: `${order.receivePercent}%` }"
              />
            </div>
            <p class="text-xs text-grey-500">
              {{ order.quantityReceived }} of {{ order.quantityOrdered }}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <p
            class="text-sm"
            :class="order.expectedDateOverdue ? 'font-medium text-negative-500' : 'text-grey-700'"
          >
            {{ order.expectedDateLabel }}
          </p>
        </TableCell>
        <TableCell class="!pl-0" @click.stop>
          <PurchaseOrderActionsMenu
            :order="order"
            :disabled="busyOrderId === order.id"
            :loading="loadingOrderId === order.id || busyOrderId === order.id"
            @view-invoice="emit('viewInvoice', order)"
            @receive="emit('receive', order)"
            @edit="emit('edit', order)"
            @send-invoice="emit('sendInvoice', order)"
            @download="emit('download', order)"
            @cancel-remaining="emit('cancelRemaining', order)"
            @delete-order="emit('deleteOrder', order)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && orders.length > 0">
      <PaginationBar
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
