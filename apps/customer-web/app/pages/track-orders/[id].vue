<script setup lang="ts">
import type { OrderDetailRecord, OrderTimelineRecord } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import OrderDetailPageHeader from '~/components/orders/OrderDetailPageHeader.vue';
import OrderDetailsPanel from '~/components/orders/OrderDetailsPanel.vue';
import OrderTimeline from '~/components/orders/OrderTimeline.vue';
import {
  buildOrderDetailsView,
  formatOrderCurrency,
  type OrderDetailsView,
} from '~/lib/order-details';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useReorderProducts } from '~/composables/useReorderProducts';
import { useCustomerOrderService } from '~/services/order.service';

const { reorderProducts, reordering } = useReorderProducts();
const downloadingInvoice = ref(false);

const route = useRoute();
const router = useRouter();
const orderId = computed(() => String(route.params.id ?? ''));

const { getOrder, getOrderTimeline, getOrderInvoiceUrl } = useCustomerOrderService();

const order = ref<OrderDetailRecord | null>(null);
const timeline = ref<OrderTimelineRecord[]>([]);

const {
  data: orderDetailPayload,
  pending: loading,
} = await useAuthenticatedAsyncData(
  'track-order-detail',
  async () => {
    if (!orderId.value) {
      return {
        order: null as OrderDetailRecord | null,
        timeline: [] as OrderTimelineRecord[],
      };
    }

    const orderResponse = await getOrder(orderId.value);
    const nextOrder = orderResponse.data ?? null;

    if (!nextOrder) {
      return {
        order: null as OrderDetailRecord | null,
        timeline: [] as OrderTimelineRecord[],
      };
    }

    const nextTimeline = nextOrder.timeline?.length
      ? nextOrder.timeline
      : await getOrderTimeline(orderId.value);

    return {
      order: nextOrder,
      timeline: nextTimeline,
    };
  },
  {
    watch: [orderId],
    default: () => ({
      order: null as OrderDetailRecord | null,
      timeline: [] as OrderTimelineRecord[],
    }),
  },
);

watch(
  orderDetailPayload,
  (payload) => {
    if (!payload) {
      return;
    }

    order.value = payload.order ?? null;
    timeline.value = Array.isArray(payload.timeline) ? payload.timeline : [];
  },
  { immediate: true },
);

const detailsView = computed<OrderDetailsView | null>(() =>
  order.value ? buildOrderDetailsView(order.value) : null,
);

useHead({
  title: computed(() =>
    order.value ? `${order.value.reference} · Orders` : 'Order details',
  ),
});

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }

  void navigateTo('/track-orders');
}

async function handleDownloadInvoice() {
  if (!orderId.value || downloadingInvoice.value) {
    return;
  }

  downloadingInvoice.value = true;

  try {
    const response = await fetch(getOrderInvoiceUrl(orderId.value), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Invoice download failed');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `order_invoice_${order.value?.reference ?? orderId.value}.pdf`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    toast.error('Unable to download invoice right now.');
  } finally {
    downloadingInvoice.value = false;
  }
}

async function handleReorder() {
  if (!order.value?.products?.length) {
    return;
  }

  await reorderProducts(order.value.products);
}
</script>

<template>
  <div data-testid="order-detail-page" class="flex flex-col gap-2">
    <OrderDetailPageHeader
      :view="detailsView"
      :loading="loading"
      :reorder-loading="reordering"
      :download-invoice-loading="downloadingInvoice"
      @back="goBack"
      @download-invoice="handleDownloadInvoice"
      @reorder="handleReorder"
    />

    <OrderDetailsPanel
      :view="detailsView"
      :loading="loading"
      :format-currency="formatOrderCurrency"
    />

    <OrderTimeline
      :events="timeline"
      :loading="loading"
    />
  </div>
</template>
