<script setup lang="ts">
import type { OrderDetailRecord, OrderTimelineRecord } from '@gosource/api-client';
import OrderDetailPageHeader from '~/components/orders/OrderDetailPageHeader.vue';
import OrderDetailsPanel from '~/components/orders/OrderDetailsPanel.vue';
import OrderTimeline from '~/components/orders/OrderTimeline.vue';
import {
  buildOrderDetailsView,
  formatOrderCurrency,
  type OrderDetailsView,
} from '~/lib/order-details';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useDownloadOrderInvoice } from '~/composables/useDownloadOrderInvoice';
import { useReorderProducts, REORDER_THEN_MARKET_OPTIONS } from '~/composables/useReorderProducts';
import { useCustomerOrderService } from '~/services/order.service';

const { reorderProducts, reordering } = useReorderProducts();
const { downloadingInvoice, downloadOrderInvoice } = useDownloadOrderInvoice();

const route = useRoute();
const orderId = computed(() => String(route.params.id ?? ''));

const { getOrder, getOrderTimeline } = useCustomerOrderService();

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
    fastNav: true,
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
  void navigateTo('/track-orders');
}

async function handleDownloadInvoice() {
  if (!order.value) {
    if (orderId.value) {
      await downloadOrderInvoice(orderId.value);
    }
    return;
  }

  await downloadOrderInvoice(order.value);
}

async function handleReorder() {
  if (!order.value?.products?.length) {
    return;
  }

  await reorderProducts(order.value.products, REORDER_THEN_MARKET_OPTIONS);
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
