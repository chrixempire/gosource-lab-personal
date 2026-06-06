<script setup lang="ts">
import { Button, SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Plus } from 'lucide-vue-next';
import PurchaseOrderCardsGrid from '~/components/purchase-orders/PurchaseOrderCardsGrid.vue';
import PurchaseOrderConfirmDialog from '~/components/purchase-orders/PurchaseOrderConfirmDialog.vue';
import PurchaseOrderFilterBar from '~/components/purchase-orders/PurchaseOrderFilterBar.vue';
import PurchaseOrderInvoiceDrawer from '~/components/purchase-orders/PurchaseOrderInvoiceDrawer.vue';
import PurchaseOrderReceiveDialog from '~/components/purchase-orders/PurchaseOrderReceiveDialog.vue';
import PurchaseOrderStatCards from '~/components/purchase-orders/PurchaseOrderStatCards.vue';
import PurchaseOrderTable from '~/components/purchase-orders/PurchaseOrderTable.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { usePurchaseOrderListFilters } from '~/composables/usePurchaseOrderListFilters';
import { usePurchaseOrderMutations } from '~/composables/usePurchaseOrderMutations';
import {
  purchaseOrderCreatePath,
  purchaseOrderEditPath,
} from '~/lib/admin-routes';
import {
  buildReceiveRows,
  parsePurchaseOrderDetail,
  parsePurchaseOrdersListResponse,
} from '~/lib/purchase-order-api';
import { purchaseOrderListFiltersToApiQuery } from '~/lib/purchase-order-filters';
import type { AdminPurchaseOrderListItem } from '~/types/purchase-orders';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } = usePurchaseOrderListFilters();
const {
  routeView,
  effectiveView,
  isCompactViewport,
  setView,
} = useCollectionRouteState('table');
const {
  busyOrderId,
  deletePurchaseOrder,
  cancelRemainingItems,
  receiveItems,
  downloadInvoice,
  sendInvoice,
} = usePurchaseOrderMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);
const selectedIds = ref<string[]>([]);

const invoiceOpen = ref(false);
const receiveOpen = ref(false);
const confirmOpen = ref(false);
const confirmMode = ref<'delete' | 'cancel'>('delete');
const activeOrder = ref<AdminPurchaseOrderListItem | null>(null);
const receiveRows = ref<ReturnType<typeof buildReceiveRows>>([]);
const invoicePreview = ref<AdminPurchaseOrderListItem['invoicePreview'] | null>(null);
const actionLoadingOrderId = ref<string | null>(null);

const apiQuery = computed(() => purchaseOrderListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/purchase-orders', {
  query: apiQuery,
  watch: [apiQuery],
});

const parsed = computed(() =>
  parsePurchaseOrdersListResponse(data.value, filters.value.page, filters.value.limit),
);
const orders = computed(() => parsed.value.rows);
const meta = computed(() => parsed.value.meta);
const stats = computed(() => parsed.value.stats);

watch(
  () => filters.value.id,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.id) {
    return;
  }
  replaceFilters({ id: trimmed, page: 1 });
});

function onFilterStatus(status: string | null) {
  if (!status) {
    replaceFilters({ status: [], page: 1 });
    return;
  }

  const current = filters.value.status;
  const next = current.includes(status as (typeof current)[number])
    ? current.filter((entry) => entry !== status)
    : [...current, status as (typeof current)[number]];

  replaceFilters({ status: next, page: 1 });
}

async function loadOrderDetail(orderId: string) {
  const payload = await $fetch<unknown>(`/api/purchase-orders/${orderId}`);
  return parsePurchaseOrderDetail(payload);
}

async function onViewInvoice(order: AdminPurchaseOrderListItem) {
  actionLoadingOrderId.value = order.id;
  try {
    activeOrder.value = order;
    invoicePreview.value = order.invoicePreview;
    await nextTick();
    invoiceOpen.value = true;
  } finally {
    setTimeout(() => {
      if (actionLoadingOrderId.value === order.id) {
        actionLoadingOrderId.value = null;
      }
    }, 220);
  }
}

async function onReceive(order: AdminPurchaseOrderListItem) {
  actionLoadingOrderId.value = order.id;
  try {
    activeOrder.value = order;
    const detail = await loadOrderDetail(order.id);
    if (detail) {
      receiveRows.value = buildReceiveRows(detail);
      receiveOpen.value = true;
    }
  } finally {
    if (actionLoadingOrderId.value === order.id) {
      actionLoadingOrderId.value = null;
    }
  }
}

function onEdit(order: AdminPurchaseOrderListItem) {
  void navigateTo(purchaseOrderEditPath(order.id));
}

function onDeleteRequest(order: AdminPurchaseOrderListItem) {
  activeOrder.value = order;
  confirmMode.value = 'delete';
  confirmOpen.value = true;
}

function onCancelRemainingRequest(order: AdminPurchaseOrderListItem) {
  activeOrder.value = order;
  confirmMode.value = 'cancel';
  confirmOpen.value = true;
}

async function onConfirmDialog() {
  if (!activeOrder.value) {
    return;
  }

  const orderId = activeOrder.value.id;
  confirmOpen.value = false;
  try {
    if (confirmMode.value === 'delete') {
      await deletePurchaseOrder(orderId);
    } else {
      await cancelRemainingItems(orderId);
    }
    activeOrder.value = null;
    await refresh();
  } catch {
    confirmOpen.value = true;
    // toast in composable
  }
}

async function onReceiveConfirm(items: { productId: string; quantityReceived: number }[]) {
  if (!activeOrder.value) {
    return;
  }

  const orderId = activeOrder.value.id;
  try {
    await receiveItems(orderId, items);
    receiveOpen.value = false;
    activeOrder.value = null;
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onDownload(order: AdminPurchaseOrderListItem) {
  actionLoadingOrderId.value = order.id;
  try {
    await downloadInvoice(order.id, order.referenceLabel);
  } catch {
    // toast in composable
  } finally {
    if (actionLoadingOrderId.value === order.id) {
      actionLoadingOrderId.value = null;
    }
  }
}

async function onSendInvoice(order: AdminPurchaseOrderListItem) {
  actionLoadingOrderId.value = order.id;
  try {
    await sendInvoice(order.id);
  } catch {
    // toast in composable
  } finally {
    if (actionLoadingOrderId.value === order.id) {
      actionLoadingOrderId.value = null;
    }
  }
}

updateHeader({
  title: 'Purchase orders',
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <p class="max-w-xl text-sm text-grey-600">
        Create and manage supplier purchase orders, receive stock, and share invoices.
      </p>
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0 self-start"
        :left-icon="Plus"
        @click="navigateTo(purchaseOrderCreatePath())"
      >
        Create purchase order
      </Button>
    </div>

    <PurchaseOrderStatCards
      :filters="filters"
      :stats="stats"
      @filter-status="onFilterStatus"
    />

    <div
      class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between"
    >
      <div class="w-full min-[1000px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search by order ID"
          :disabled="pending && orders.length === 0"
        />
      </div>
      <ViewToggle
        :model-value="routeView"
        @update:model-value="setView"
      />
    </div>

    <PurchaseOrderFilterBar
      :filters="filters"
      @apply="replaceFilters"
      @clear-all="resetFilters"
    />

    <LoadErrorState
      v-if="error && orders.length === 0"
      :error="error"
      load-failed-title="Unable to load purchase orders"
      resource-label="purchase order list"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && orders.length === 0"
      title="No purchase orders yet"
      description="Create a purchase order to start tracking supplier deliveries."
    >
      <Button type="button" size="small" @click="navigateTo(purchaseOrderCreatePath())">
        Create purchase order
      </Button>
    </EmptyState>

    <template v-else>
      <PurchaseOrderCardsGrid
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :orders="orders"
        :meta="meta"
        :loading="pending"
        :busy-order-id="busyOrderId"
        :loading-order-id="actionLoadingOrderId"
        @page="setPage"
        @page-size="setLimit"
        @row-click="onViewInvoice"
        @view-invoice="onViewInvoice"
        @receive="onReceive"
        @edit="onEdit"
        @send-invoice="onSendInvoice"
        @download="onDownload"
        @cancel-remaining="onCancelRemainingRequest"
        @delete-order="onDeleteRequest"
      />
      <PurchaseOrderTable
        v-else
        v-model:selected-ids="selectedIds"
        :orders="orders"
        :meta="meta"
        :loading="pending"
        :busy-order-id="busyOrderId"
        :loading-order-id="actionLoadingOrderId"
        @page="setPage"
        @page-size="setLimit"
        @row-click="onViewInvoice"
        @view-invoice="onViewInvoice"
        @receive="onReceive"
        @edit="onEdit"
        @send-invoice="onSendInvoice"
        @download="onDownload"
        @cancel-remaining="onCancelRemainingRequest"
        @delete-order="onDeleteRequest"
      />
    </template>

    <PurchaseOrderInvoiceDrawer v-model:open="invoiceOpen" :preview="invoicePreview" />

    <PurchaseOrderReceiveDialog
      v-model:open="receiveOpen"
      :rows="receiveRows"
      :loading="Boolean(activeOrder && busyOrderId === activeOrder.id)"
      @confirm="onReceiveConfirm"
    />

    <PurchaseOrderConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmMode === 'delete' ? 'Delete purchase order?' : 'Cancel remaining items?'"
      :description="
        confirmMode === 'delete'
          ? 'This purchase order will be permanently deleted. This action cannot be undone.'
          : 'Remaining quantities on this order will be cancelled. This action cannot be undone.'
      "
      :confirm-label="confirmMode === 'delete' ? 'Delete order' : 'Cancel items'"
      :destructive="true"
      :loading="Boolean(activeOrder && busyOrderId === activeOrder.id)"
      @confirm="onConfirmDialog"
    />
  </div>
</template>
