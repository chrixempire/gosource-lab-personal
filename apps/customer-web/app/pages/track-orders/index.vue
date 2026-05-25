<script setup lang="ts">
import type { BranchRecord, CustomerMeResponse, OrderRecord } from '@gosource/api-client';
import { PaginationBar, ViewToggle } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import OrderCards from '~/components/orders/OrderCards.vue';
import OrderTable from '~/components/orders/OrderTable.vue';
import TrackOrdersFilterBar from '~/components/orders/TrackOrdersFilterBar.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  mapOrderToListItem,
  type OrderListItem,
} from '~/lib/order-details';
import {
  DEFAULT_TRACK_ORDER_STATUS,
  parseTrackOrderFiltersFromQuery,
  trackOrderFiltersToRouteQuery,
  trackOrderStatusFiltersToApiStatus,
  type TrackOrderListFilters,
} from '~/lib/track-order-filters';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useReorderProducts } from '~/composables/useReorderProducts';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerOrderService } from '~/services/order.service';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));

const { reorderProducts, reordering } = useReorderProducts();

const { listBranches } = useCustomerBranchService();
const { listOrders } = useCustomerOrderService();
const branches = ref<BranchRecord[]>([]);
const selectedBranchId = ref('');
const route = useRoute();
const router = useRouter();
const {
  effectiveView,
  routeView,
  isCompactViewport,
  page,
  limit,
  setPage,
  setLimit,
  setView,
} = useCollectionRouteState('table');

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

const listFilters = computed(() => parseTrackOrderFiltersFromQuery(route.query));

const hasDefaultStatusOnly = computed(() => {
  const { status } = listFilters.value;
  return status.length === 1 && status[0] === DEFAULT_TRACK_ORDER_STATUS;
});

const emptyStateStatusLabel = computed(() => {
  const { status } = listFilters.value;
  if (status.length === 0) {
    return 'matching';
  }
  if (status.length === 1) {
    return status[0];
  }
  return 'matching';
});

watch(debouncedSearch, (next, prev) => {
  if (next !== prev && page.value !== 1) {
    setPage(1);
  }
});

watch(selectedBranchId, (next, prev) => {
  if (next !== prev && page.value !== 1) {
    setPage(1);
  }
});

const { data: ordersPayload, pending: loading } = await useAuthenticatedAsyncData(
  'track-orders-list',
  async () => {
    const statusParam = trackOrderStatusFiltersToApiStatus(listFilters.value.status);

    const requests: [Promise<{ data?: OrderRecord[]; meta?: typeof defaultMeta }>] = [
      listOrders({
        page: page.value,
        limit: limit.value,
        status: statusParam,
        amountFrom: listFilters.value.amountMin ?? undefined,
        amountTo: listFilters.value.amountMax ?? undefined,
        search: debouncedSearch.value.trim() || undefined,
        branchId:
          isSuperAdmin.value && selectedBranchId.value
            ? selectedBranchId.value
            : undefined,
      }),
    ];

    if (isSuperAdmin.value) {
      const [ordersResponse, branchesResponse] = await Promise.all([
        requests[0],
        listBranches({ page: 1, limit: 100 }),
      ]);

      return {
        branches: branchesResponse.data ?? [],
        orders: (ordersResponse.data ?? []) as OrderRecord[],
        meta: ordersResponse.meta ?? defaultMeta,
      };
    }

    const ordersResponse = await requests[0];
    return {
      branches: [] as BranchRecord[],
      orders: (ordersResponse.data ?? []) as OrderRecord[],
      meta: ordersResponse.meta ?? defaultMeta,
    };
  },
  {
    watch: [
      page,
      limit,
      debouncedSearch,
      () => listFilters.value.amountMin,
      () => listFilters.value.amountMax,
      () => listFilters.value.status.join(','),
      selectedBranchId,
    ],
    default: () => ({
      branches: [] as BranchRecord[],
      orders: [] as OrderRecord[],
      meta: { ...defaultMeta },
    }),
  },
);

watch(
  ordersPayload,
  (payload) => {
    if (!payload) {
      return;
    }
    if (isSuperAdmin.value) {
      branches.value = Array.isArray(payload.branches) ? payload.branches : [];
    }
  },
  { immediate: true },
);

const branchesLoading = computed(
  () => loading.value && isSuperAdmin.value && branches.value.length === 0,
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

function replaceListFilters(next: Partial<TrackOrderListFilters>) {
  const merged: TrackOrderListFilters = {
    ...listFilters.value,
    ...next,
  };

  const filterQuery = trackOrderFiltersToRouteQuery(merged);
  const nextQuery = { ...route.query, ...filterQuery, page: '1' } as Record<
    string,
    string | string[] | undefined
  >;

  if (!filterQuery.amountFrom) {
    delete nextQuery.amountFrom;
  }
  if (!filterQuery.amountTo) {
    delete nextQuery.amountTo;
  }

  router.replace({ query: nextQuery });
}

function onApplyFilters(next: Partial<TrackOrderListFilters>) {
  replaceListFilters(next);
}

function clearAllFilters() {
  searchValue.value = '';
  debouncedSearch.value = '';
  selectedBranchId.value = '';

  const { amountFrom, amountTo, status, ...rest } = route.query;
  router.replace({
    query: {
      ...rest,
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
        <div
          class="flex w-full flex-col gap-3 min-[1000px]:max-w-md"
          :class="isSuperAdmin ? 'min-[1000px]:flex-1' : undefined"
        >
          <BranchPickerDropdown
            v-if="isSuperAdmin"
            v-model="selectedBranchId"
            :branches="branches"
            :loading="branchesLoading"
            :disabled="loading"
            show-all-branches-option
          />
          <SearchField
            v-model="searchValue"
            placeholder="Search by product name or reference"
            :disabled="loading"
          />
        </div>
        <div class="flex items-center justify-between gap-3 min-[1000px]:shrink-0 min-[1000px]:justify-end">
          <p class="text-sm text-grey-300 min-[1000px]:text-right">
            {{ displayedCountLabel }}
          </p>
          <ViewToggle
            v-if="!isCompactViewport"
            class="shrink-0"
            :model-value="routeView"
            @update:model-value="setView"
          />
        </div>
      </div>

      <TrackOrdersFilterBar
        :filters="listFilters"
        :search="debouncedSearch"
        :branch-id="selectedBranchId"
        :has-default-status-only="hasDefaultStatusOnly"
        @apply="onApplyFilters"
        @clear-all="clearAllFilters"
      />

      <OrderTable
        v-if="effectiveView === 'table'"
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

      <div v-else-if="!loading" class="space-y-4">
        <OrderCards
          v-if="orderItems.length"
          :orders="orderItems"
          :reorder-loading="reordering"
          :reorder-loading-order-id="reorderLoadingOrderId"
          @click="openOrder"
          @view-details="openOrder"
          @reorder="(order) => handleReorder(order.id)"
        />

        <div
          v-else
          class="rounded-[24px] border border-dashed border-grey-50 bg-white px-6 py-12 text-center"
        >
          <p class="text-base font-medium text-grey-900">
            No {{ emptyStateStatusLabel }} orders
          </p>
          <p class="mt-2 text-sm text-grey-300">
            Orders appear here after a request is approved and paid at checkout.
          </p>
        </div>

        <PaginationBar
          plain
          :page="meta.page"
          :total-pages="meta.totalPages"
          :total-items="meta.total"
          :page-size="meta.limit"
          :has-next-page="meta.hasNextPage"
          :has-prev-page="meta.hasPrevPage"
          @change="setPage"
          @page-size-change="setLimit"
        />
      </div>

      <div v-else class="flex flex-wrap gap-4">
        <div
          v-for="index in 3"
          :key="`order-card-skeleton-${index}`"
          class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-white p-5"
        >
          <div class="flex items-start gap-3">
            <div class="size-10 shrink-0 animate-pulse rounded-lg bg-grey-55" />
            <div class="min-w-0 flex-1 space-y-2">
              <div class="h-5 w-32 animate-pulse rounded bg-grey-55" />
              <div class="h-4 w-full animate-pulse rounded bg-grey-55" />
            </div>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <div
              v-for="cardIndex in 4"
              :key="cardIndex"
              class="h-16 animate-pulse rounded-[18px] bg-grey-55"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
