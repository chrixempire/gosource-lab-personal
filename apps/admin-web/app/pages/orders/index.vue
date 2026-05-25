<script setup lang="ts">
import { Button, SearchField, toast, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Download } from 'lucide-vue-next';
import OrderCancelDialog from '~/components/orders/OrderCancelDialog.vue';
import OrderFilterBar from '~/components/orders/OrderFilterBar.vue';
import OrderStatCards from '~/components/orders/OrderStatCards.vue';
import OrderTable from '~/components/orders/OrderTable.vue';
import OrderVirtualCards from '~/components/orders/OrderVirtualCards.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useInfiniteOrders } from '~/composables/useInfiniteOrders';
import { useOrderListFilters } from '~/composables/useOrderListFilters';
import { useOrderMutations } from '~/composables/useOrderMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { downloadOrdersCsv } from '~/lib/order-export';
import {
  buildOrderPaymentStatusPatch,
  buildOrderStatusPatch,
} from '~/lib/order-list-patch';
import type { AdminOrderListItem, OrderPaymentStatus, OrderStatus } from '~/types/orders';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters } = useOrderListFilters();
const {
  routeView,
  effectiveView,
  isCompactViewport,
  setView,
} = useCollectionRouteState('table');

const {
  orders,
  total,
  hasMore,
  loading,
  loadingMore,
  error,
  loadMore,
  refresh,
  patchOrder,
} = useInfiniteOrders(filters);

const {
  updatingOrderId,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  downloadOrderInvoice,
} = useOrderMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);
const cancelDialogOpen = ref(false);
const cancelTarget = ref<AdminOrderListItem | null>(null);
const selectedIds = ref<string[]>([]);

watch(
  () => filters.value.reference,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.reference) {
    return;
  }
  replaceFilters({ reference: trimmed, page: 1 });
});

function onApplyFilters(next: Partial<typeof filters.value>) {
  replaceFilters({ ...next, page: 1 });
}

function onFilterStatus(status: string | null) {
  if (!status) {
    replaceFilters({ status: [], page: 1 });
    return;
  }

  const current = filters.value.status;
  const next = current.includes(status)
    ? current.filter((entry) => entry !== status)
    : [...current, status];

  replaceFilters({ status: next, page: 1 });
}

function onRowClick(order: AdminOrderListItem) {
  navigateTo(`${ADMIN_PAGE_ROUTES.ORDERS}/${order.id}`);
}

async function onUpdateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    await updateOrderStatus(orderId, status);
    patchOrder(orderId, buildOrderStatusPatch(status));
  } catch {
    // toast handled in composable
  }
}

async function onUpdatePaymentStatus(orderId: string, status: OrderPaymentStatus) {
  try {
    await updatePaymentStatus(orderId, status);
    patchOrder(orderId, buildOrderPaymentStatusPatch(status));
  } catch {
    // toast handled in composable
  }
}

function onCancelRequest(order: AdminOrderListItem) {
  cancelTarget.value = order;
  cancelDialogOpen.value = true;
}

async function onCancelConfirm(reason: string) {
  if (!cancelTarget.value) {
    return;
  }

  try {
    await cancelOrder(cancelTarget.value.id, reason);
    patchOrder(cancelTarget.value.id, buildOrderStatusPatch('cancelled'));
    cancelDialogOpen.value = false;
    cancelTarget.value = null;
  } catch {
    // toast handled in composable
  }
}

async function onDownload(order: AdminOrderListItem) {
  try {
    await downloadOrderInvoice(order.id, order.reference);
  } catch {
    // toast handled in composable
  }
}

function onExportCsv() {
  if (orders.value.length === 0) {
    toast.error('No orders to export');
    return;
  }
  downloadOrdersCsv(orders.value);
}

updateHeader({
  title: 'Orders',
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="flex flex-col gap-2 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between">
      <p class="max-w-3xl text-base leading-7 text-grey-text">
        Search, filter, and manage customer orders.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0 self-start"
        :left-icon="Download"
        :disabled="loading || orders.length === 0"
        @click="onExportCsv"
      >
        Export CSV
      </Button>
    </div>

    <OrderStatCards
      :filters="filters"
      :orders="orders"
      :total-count="total"
      @filter-status="onFilterStatus"
    />

    <div class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between">
      <div class="w-full min-[1000px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search by order reference"
          :disabled="loading && orders.length === 0"
        />
      </div>

      <div
        class="flex items-center gap-2"
        :class="loading && orders.length === 0 ? 'pointer-events-none opacity-50' : undefined"
      >
        <ViewToggle
          v-if="!isCompactViewport"
          :model-value="routeView"
          @update:model-value="setView"
        />
      </div>
    </div>

    <OrderFilterBar
      :filters="filters"
      @apply="onApplyFilters"
      @clear-all="resetFilters"
    />

    <LoadErrorState
      v-if="error && orders.length === 0"
      :error="error"
      load-failed-title="Unable to load orders"
      resource-label="order list"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !loading && orders.length === 0"
      title="No orders found"
      description="Try adjusting your search or filters."
    />

    <template v-else>
      <OrderVirtualCards
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :orders="orders"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :updating-order-id="updatingOrderId"
        @load-more="loadMore"
        @row-click="onRowClick"
        @update-order-status="onUpdateOrderStatus"
        @update-payment-status="onUpdatePaymentStatus"
        @download="onDownload"
        @cancel="onCancelRequest"
      />
      <OrderTable
        v-else
        v-model:selected-ids="selectedIds"
        :orders="orders"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :updating-order-id="updatingOrderId"
        @load-more="loadMore"
        @row-click="onRowClick"
        @update-order-status="onUpdateOrderStatus"
        @update-payment-status="onUpdatePaymentStatus"
        @download="onDownload"
        @cancel="onCancelRequest"
      />
    </template>

    <OrderCancelDialog
      v-model:open="cancelDialogOpen"
      :order-reference="cancelTarget?.referenceLabel"
      :loading="Boolean(cancelTarget && updatingOrderId === cancelTarget.id)"
      @confirm="onCancelConfirm"
    />
  </div>
</template>
