<script setup lang="ts">
import AdminOrderDetailHeader from '~/components/orders/AdminOrderDetailHeader.vue';
import AdminOrderDetailsPanel from '~/components/orders/AdminOrderDetailsPanel.vue';
import AdminOrderSummary from '~/components/orders/AdminOrderSummary.vue';
import AdminOrderTimeline from '~/components/orders/AdminOrderTimeline.vue';
import OrderCancelDialog from '~/components/orders/OrderCancelDialog.vue';
import OrderInvoiceDrawer from '~/components/orders/OrderInvoiceDrawer.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useOrderMutations } from '~/composables/useOrderMutations';
import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { isOrderCancellable } from '~/lib/order-constants';
import {
  mapLegacyOrderToDetailsView,
  mapLegacyOrderTimeline,
  type AdminOrderDetailsView,
} from '~/lib/order-details';
import type { OrderInvoicePreview } from '~/types/order-invoice';
import type { OrderPaymentStatus, OrderStatus } from '~/types/orders';

const route = useRoute();
const router = useRouter();
const orderId = computed(() => String(route.params.id ?? ''));

const cancelDialogOpen = ref(false);
const invoiceOpen = ref(false);
const invoicePreview = ref<OrderInvoicePreview | null>(null);
const previewLoading = ref(false);
const invoiceLoading = ref(false);

const {
  updatingOrderId,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  buildOrderInvoicePreviewFromRaw,
  downloadOrderInvoice,
  downloadOrderInvoiceFromPreview,
} = useOrderMutations();

const { data, pending, error, refresh } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/orders/${orderId.value}`,
  {
    watch: [orderId],
    key: computed(() => `admin-order-detail:${orderId.value}`),
  },
);

const rawOrder = computed(() => unwrapLegacyPayload(data.value));

const detailsView = computed<AdminOrderDetailsView | null>(() => {
  if (!rawOrder.value || typeof rawOrder.value !== 'object') {
    return null;
  }
  return mapLegacyOrderToDetailsView(rawOrder.value);
});

const timeline = computed(() => {
  if (!rawOrder.value || typeof rawOrder.value !== 'object') {
    return [];
  }
  return mapLegacyOrderTimeline(rawOrder.value);
});

const canCancel = computed(() =>
  rawOrder.value && typeof rawOrder.value === 'object'
    ? isOrderCancellable(rawOrder.value as { status?: string; paymentStatus?: string })
    : false,
);

const canChangeStatus = computed(() => detailsView.value?.status !== 'cancelled');

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }
  void navigateTo('/orders');
}

function resolveInvoicePreview() {
  if (!rawOrder.value || typeof rawOrder.value !== 'object') {
    return null;
  }
  return buildOrderInvoicePreviewFromRaw(rawOrder.value);
}

async function handlePreviewInvoice() {
  if (!rawOrder.value) {
    return;
  }

  previewLoading.value = true;
  try {
    invoicePreview.value = resolveInvoicePreview();
    await nextTick();
    invoiceOpen.value = true;
  } finally {
    previewLoading.value = false;
  }
}

async function handleDownloadInvoice() {
  if (!orderId.value) {
    return;
  }

  invoiceLoading.value = true;
  try {
    const preview = resolveInvoicePreview();
    if (preview) {
      await downloadOrderInvoiceFromPreview(preview, detailsView.value?.reference);
      return;
    }

    await downloadOrderInvoice(orderId.value, detailsView.value?.reference);
  } finally {
    invoiceLoading.value = false;
  }
}

async function onCancelConfirm(reason: string) {
  try {
    await cancelOrder(orderId.value, reason);
    cancelDialogOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onChangeOrderStatus(status: OrderStatus) {
  try {
    await updateOrderStatus(orderId.value, status);
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onUpdatePaymentStatus(status: OrderPaymentStatus) {
  try {
    await updatePaymentStatus(orderId.value, status);
    await refresh();
  } catch {
    // toast in composable
  }
}

useHead({
  title: computed(() =>
    detailsView.value ? `${detailsView.value.referenceLabel} · Orders` : 'Order details',
  ),
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <AdminOrderDetailHeader
      :view="detailsView"
      :loading="pending"
      :preview-loading="previewLoading"
      :invoice-loading="invoiceLoading"
      :can-cancel="canCancel"
      :can-change-status="canChangeStatus"
      :actions-disabled="updatingOrderId === orderId"
      @back="goBack"
      @preview-invoice="handlePreviewInvoice"
      @download-invoice="handleDownloadInvoice"
      @change-status="onChangeOrderStatus"
      @cancel="cancelDialogOpen = true"
    />

    <LoadErrorState
      v-if="!pending && (error || !detailsView)"
      :error="error"
      not-found-title="Order not found"
      resource-label="order"
      @retry="refresh()"
    />

    <template v-else>
      <AdminOrderDetailsPanel
        :view="detailsView"
        :loading="pending"
        :order-id="orderId"
        :payment-status-updating="updatingOrderId === orderId"
        @update-payment-status="onUpdatePaymentStatus"
        @line-items-updated="refresh()"
      />

      <div class="flex flex-col items-stretch gap-4 lg:flex-row">
        <AdminOrderTimeline
          class="min-w-0 lg:w-[40%] lg:shrink-0"
          :events="timeline"
          :loading="pending"
        />
        <AdminOrderSummary
          class="min-w-0 lg:w-[60%] lg:shrink-0"
          :view="detailsView"
          :loading="pending"
        />
      </div>
    </template>

    <OrderInvoiceDrawer v-model:open="invoiceOpen" :preview="invoicePreview" />

    <OrderCancelDialog
      v-model:open="cancelDialogOpen"
      :order-reference="detailsView?.referenceLabel"
      :loading="updatingOrderId === orderId"
      @confirm="onCancelConfirm"
    />
  </div>
</template>
