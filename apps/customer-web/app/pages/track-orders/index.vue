<script setup lang="ts">
import type { OrderRecord } from '@gosource/api-client';
import { useDebounceFn } from '@vueuse/core';
import OrderTable from '~/components/orders/OrderTable.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import {
  mapOrderToListItem,
  type OrderListItem,
} from '~/lib/order-details';
import {
  ORDER_STATUS_FILTERS,
  orderStatusFilterForRoute,
  type OrderStatusFilter,
} from '~/lib/order-status';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useReorderProducts } from '~/composables/useReorderProducts';
import { useCustomerOrderService } from '~/services/order.service';

const { reorderProducts, reordering } = useReorderProducts();

const { listOrders } = useCustomerOrderService();
const route = useRoute();
const router = useRouter();
const { page, limit, setPage, setLimit } = useCollectionRouteState('table');

const defaultMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const searchValue = ref('');
const debouncedSearch = ref('');
const reorderLoadingOrderId = ref<string | null>(null);

const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value;
}, 200);

watch(searchValue, (value) => {
  syncSearch(value);
});

const orderStatusOptions: { label: string; value: OrderStatusFilter }[] = [
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
  { label: 'Refunded', value: 'refunded' },
];

const orderStatusFilter = computed<OrderStatusFilter>(() => {
  const raw = route.query.status;
  const value = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

  if (value && ORDER_STATUS_FILTERS.has(value as OrderStatusFilter)) {
    return value as OrderStatusFilter;
  }

  return 'ongoing';
});

watch(debouncedSearch, (next, prev) => {
  if (next !== prev && page.value !== 1) {
    setPage(1);
  }
});

const { data: ordersPayload, pending: loading } = await useAuthenticatedAsyncData(
  'track-orders-list',
  async () => {
    const response = await listOrders({
      page: page.value,
      limit: limit.value,
      status: orderStatusFilterForRoute(orderStatusFilter.value),
      search: debouncedSearch.value.trim() || undefined,
    });
    return {
      orders: (response.data ?? []) as OrderRecord[],
      meta: response.meta ?? defaultMeta,
    };
  },
  {
    watch: [page, limit, debouncedSearch, orderStatusFilter],
    default: () => ({
      orders: [] as OrderRecord[],
      meta: { ...defaultMeta },
    }),
  },
);

const orders = computed(() =>
  Array.isArray(ordersPayload.value?.orders) ? ordersPayload.value.orders : [],
);
const meta = computed(() => ordersPayload.value?.meta ?? defaultMeta);

const orderItems = computed<OrderListItem[]>(() =>
  orders.value.map(mapOrderToListItem),
);

const displayedCountLabel = computed(() => {
  const count = meta.value.total || orderItems.value.length;
  return `${count} order${count === 1 ? '' : 's'}`;
});

function setOrderStatusFilter(nextFilter: OrderStatusFilter) {
  router.replace({
    query: {
      ...route.query,
      status: nextFilter,
      page: '1',
    },
  });
}

async function openOrder(order: OrderListItem) {
  await navigateTo(`/track-orders/${order.id}`);
}

async function handleReorder(orderId: string) {
  if (reordering.value) {
    return;
  }

  const record = orders.value.find((order: OrderRecord) => order.id === orderId);
  if (!record?.products?.length) {
    return;
  }

  reorderLoadingOrderId.value = orderId;

  try {
    await reorderProducts(record.products);
  } finally {
    reorderLoadingOrderId.value = null;
  }
}

useHead({
  title: 'Track orders',
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="max-w-3xl text-base leading-7 text-grey-text">
      View and track fulfillment for orders placed after checkout.
    </p>

    <div class="mt-4 flex flex-col gap-6">
      <div
        class="flex w-full flex-col gap-3 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between"
      >
        <SearchField
          v-model="searchValue"
          class="w-full min-[1000px]:max-w-md"
          placeholder="Search by product name or reference"
          :disabled="loading"
        />
        <p class="text-sm text-grey-300 min-[1000px]:text-right">
          {{ displayedCountLabel }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in orderStatusOptions"
          :key="option.value"
          type="button"
          :class="[
            'cursor-pointer rounded-full border px-3 py-2 text-sm font-medium transition',
            orderStatusFilter === option.value
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-border-input-default bg-white text-grey-text hover:border-primary-300',
          ]"
          @click="setOrderStatusFilter(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <OrderTable
        :orders="orderItems"
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
        :has-next-page="meta.hasNextPage"
        :has-prev-page="meta.hasPrevPage"
        :loading="loading"
        :reorder-loading="reordering"
        :reorder-loading-order-id="reorderLoadingOrderId"
        @page="setPage"
        @page-size="setLimit"
        @row-click="openOrder"
        @view-details="openOrder"
        @reorder="(order) => handleReorder(order.id)"
      />

      <div
        v-if="!loading && orderItems.length === 0"
        class="rounded-[16px] border border-dashed border-grey-50 bg-white px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">
          No {{ orderStatusFilter }} orders
        </p>
        <p class="mt-2 text-sm text-grey-300">
          Orders appear here after a request is approved and paid at checkout.
        </p>
      </div>
    </div>
  </div>
</template>
