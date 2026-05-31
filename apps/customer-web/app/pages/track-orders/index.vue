<script setup lang="ts">
import type { CustomerMeResponse, OrderRecord } from '@gosource/api-client';
import { PaginationBar, SegmentedControl, ViewToggle } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import OrderCards from '~/components/orders/OrderCards.vue';
import OrderTable from '~/components/orders/OrderTable.vue';
import ProcurementInsightCards from '~/components/orders/ProcurementInsightCards.vue';
import ProcurementInsightDateFilter from '~/components/orders/ProcurementInsightDateFilter.vue';
import ProcurementInsightTable from '~/components/orders/ProcurementInsightTable.vue';
import TrackOrdersFilterBar from '~/components/orders/TrackOrdersFilterBar.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  insightDateFilterToRouteQuery,
  insightPeriodLabel,
  parseInsightDateFilterFromQuery,
  resolveInsightDateRange,
  type InsightDateFilterValue,
} from '~/lib/insight-date-filter';
import {
  buildInsightPaginationMeta,
  insightPaginationToRouteQuery,
  paginateInsightRows,
  parseInsightPaginationFromQuery,
} from '~/lib/insight-table-pagination';
import {
  mapOrderToListItem,
  type OrderListItem,
} from '~/lib/order-details';
import { fetchProcurementInsightForBranch } from '~/lib/explore-procurement-insight';
import { buildProcurementInsightTableRowsFromProcuredItems } from '~/lib/procurement-insight-table';
import {
  DEFAULT_TRACK_ORDER_STATUS,
  parseTrackOrderFiltersFromQuery,
  trackOrderFiltersToRouteQuery,
  trackOrderStatusFiltersToApiStatus,
  type TrackOrderListFilters,
} from '~/lib/track-order-filters';
import {
  insightViewToRouteQuery,
  parseInsightViewFromQuery,
  parseTrackOrdersTabFromQuery,
  TRACK_ORDERS_TAB_OPTIONS,
  trackOrdersTabToRouteQuery,
  type InsightViewMode,
  type TrackOrdersTab,
} from '~/lib/track-orders-page';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { usePageBranchFilter } from '~/composables/usePageBranchFilter';
import { useReorderProducts } from '~/composables/useReorderProducts';
import { useCustomerOrderService } from '~/services/order.service';
import { useCustomerAnalyticsService } from '~/services/analytics.service';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));

const { reorderProducts, reordering } = useReorderProducts();

const { listOrders } = useCustomerOrderService();
const { getTotalProcurement, getTopProcuredItems, getProductAnalysis } =
  useCustomerAnalyticsService();
const pageBranch = usePageBranchFilter();
const {
  viewBranchId: selectedBranchId,
  apiBranchId,
  branches,
  branchesLoading,
  showAllBranchesOption,
  activeBranchId,
  setPageBranchFilter,
} = pageBranch;
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

const activeTab = computed(() => parseTrackOrdersTabFromQuery(route.query));
const insightRouteView = computed(() => parseInsightViewFromQuery(route.query));
const insightEffectiveView = computed<InsightViewMode>(() =>
  isCompactViewport.value ? 'cards' : insightRouteView.value,
);
const insightDateFilter = computed(() => parseInsightDateFilterFromQuery(route.query));
const insightPeriodLabelText = computed(() => insightPeriodLabel(insightDateFilter.value));
const insightDateRange = computed(() => resolveInsightDateRange(insightDateFilter.value));

const insightBranchId = computed(() => {
  if (apiBranchId.value) {
    return apiBranchId.value;
  }

  const active = activeBranchId.value;
  return active?.trim() || undefined;
});

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

const {
  data: ordersPayload,
  pending: ordersPending,
  refresh: refreshOrders,
} = await useAuthenticatedAsyncData(
  'track-orders-list',
  async () => {
    const statusParam = trackOrderStatusFiltersToApiStatus(listFilters.value.status);

    const ordersResponse = await listOrders({
      page: page.value,
      limit: limit.value,
      status: statusParam,
      amountFrom: listFilters.value.amountMin ?? undefined,
      amountTo: listFilters.value.amountMax ?? undefined,
      search: debouncedSearch.value.trim() || undefined,
      branchId: isSuperAdmin.value ? apiBranchId.value : undefined,
    });

    return {
      orders: (ordersResponse.data ?? []) as OrderRecord[],
      meta: ordersResponse.meta ?? defaultMeta,
    };
  },
  {
    watch: false,
    default: () => ({
      orders: [] as OrderRecord[],
      meta: { ...defaultMeta },
    }),
  },
);

const {
  data: insightPayload,
  pending: insightPending,
  refresh: refreshInsight,
} = await useAuthenticatedAsyncData(
  'track-orders-procurement-insight',
  async () => {
    if (!insightBranchId.value) {
      return { rows: [] };
    }

    const { items, totalSpent } = await fetchProcurementInsightForBranch(
      { listOrders, getTotalProcurement, getTopProcuredItems, getProductAnalysis },
      insightBranchId.value,
      insightDateRange.value,
    );

    return {
      rows: buildProcurementInsightTableRowsFromProcuredItems(items, totalSpent),
      totalSpent,
    };
  },
  {
    watch: false,
    default: () => ({ rows: [] }),
  },
);

const ordersLoading = computed(() => activeTab.value === 'orders' && ordersPending.value);
const insightLoading = computed(() => activeTab.value === 'insight' && insightPending.value);

const insightRows = computed(() => insightPayload.value?.rows ?? []);
const insightPagination = computed(() => parseInsightPaginationFromQuery(route.query));
const insightMeta = computed(() =>
  buildInsightPaginationMeta(
    insightRows.value.length,
    insightPagination.value.page,
    insightPagination.value.limit,
  ),
);
const paginatedInsightRows = computed(() =>
  paginateInsightRows(insightRows.value, insightMeta.value.page, insightMeta.value.limit),
);

function replaceRouteQuery(patch: Record<string, string | undefined>) {
  const nextQuery = { ...route.query, ...patch } as Record<string, string | string[] | undefined>;

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      delete nextQuery[key];
    }
  }

  router.replace({ query: nextQuery });
}

watch(
  [
    activeTab,
    page,
    limit,
    debouncedSearch,
    () => listFilters.value.amountMin,
    () => listFilters.value.amountMax,
    () => listFilters.value.status.join(','),
    apiBranchId,
  ],
  () => {
    if (activeTab.value === 'orders') {
      void refreshOrders();
    }
  },
  { immediate: true },
);

watch(
  [
    activeTab,
    insightBranchId,
    () => insightDateRange.value.startDate,
    () => insightDateRange.value.endDate,
  ],
  () => {
    if (activeTab.value === 'insight') {
      if (insightPagination.value.page !== 1) {
        replaceRouteQuery({
          tab: 'insight',
          ...insightPaginationToRouteQuery(1, insightPagination.value.limit),
        });
      }
      void refreshInsight();
    }
  },
  { immediate: true },
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

const insightCountLabel = computed(() => {
  const count = insightMeta.value.total;
  return `${count} product${count === 1 ? '' : 's'}`;
});

function setInsightPage(nextPage: number) {
  replaceRouteQuery({
    tab: 'insight',
    ...insightPaginationToRouteQuery(nextPage, insightMeta.value.limit),
  });
}

function setInsightLimit(nextLimit: number) {
  replaceRouteQuery({
    tab: 'insight',
    ...insightPaginationToRouteQuery(1, nextLimit),
  });
}

function setInsightView(nextView: InsightViewMode) {
  if (isCompactViewport.value) {
    return;
  }

  replaceRouteQuery({
    tab: 'insight',
    ...insightViewToRouteQuery(nextView),
    ...insightPaginationToRouteQuery(1, insightMeta.value.limit),
  });
}

watch(insightMeta, (meta) => {
  if (activeTab.value !== 'insight') {
    return;
  }

  if (meta.page !== insightPagination.value.page) {
    replaceRouteQuery({
      tab: 'insight',
      ...insightPaginationToRouteQuery(meta.page, meta.limit),
    });
  }
});

function withoutInsightRouteParams(
  query: Record<string, string | string[] | undefined>,
) {
  const nextQuery = { ...query };
  delete nextQuery.insightPeriod;
  delete nextQuery.insightPage;
  delete nextQuery.insightLimit;
  delete nextQuery.insightView;
  return nextQuery;
}

function setActiveTab(tab: TrackOrdersTab) {
  const nextQuery = {
    ...route.query,
    ...trackOrdersTabToRouteQuery(tab),
  } as Record<string, string | string[] | undefined>;

  if (tab === 'insight') {
    Object.assign(
      nextQuery,
      insightDateFilterToRouteQuery(insightDateFilter.value),
      insightViewToRouteQuery(insightRouteView.value),
      insightPaginationToRouteQuery(insightMeta.value.page, insightMeta.value.limit),
    );
  } else {
    delete nextQuery.insightPeriod;
    delete nextQuery.insightPage;
    delete nextQuery.insightLimit;
    delete nextQuery.insightView;
  }

  router.replace({ query: nextQuery });
}

function onInsightDateFilterChange(next: InsightDateFilterValue) {
  replaceRouteQuery({
    tab: 'insight',
    ...insightDateFilterToRouteQuery(next),
    ...insightPaginationToRouteQuery(1, insightMeta.value.limit),
  });
}

function replaceListFilters(next: Partial<TrackOrderListFilters>) {
  const merged: TrackOrderListFilters = {
    ...listFilters.value,
    ...next,
  };

  const filterQuery = trackOrderFiltersToRouteQuery(merged);
  const nextQuery = withoutInsightRouteParams({
    ...route.query,
    ...filterQuery,
    tab: 'orders',
    page: '1',
  });

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
  pageBranch.resetViewToActiveBranch();

  const { amountFrom, amountTo, status, insightPeriod, ...rest } = route.query;
  router.replace({
    query: withoutInsightRouteParams({
      ...rest,
      tab: 'orders',
      page: '1',
    }),
  });
}

onMounted(() => {
  if (
    activeTab.value === 'orders' &&
    (route.query.insightPeriod || route.query.insightView || route.query.insightPage)
  ) {
    router.replace({
      query: withoutInsightRouteParams({ ...route.query }),
    });
  }
});

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
      View procurement insight and track fulfillment for orders placed after checkout.
    </p>

    <div class="mt-4 flex flex-col gap-6">
      <SegmentedControl
        class="w-full max-w-xs"
        :model-value="activeTab"
        :options="[...TRACK_ORDERS_TAB_OPTIONS]"
        @update:model-value="(value) => setActiveTab(value as TrackOrdersTab)"
      />

      <div v-show="activeTab === 'insight'" class="flex flex-col gap-6">
        <div
          class="flex w-full flex-col gap-3 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between"
        >
          <div
            class="flex w-full flex-col gap-3 min-[1000px]:max-w-md"
            :class="isSuperAdmin ? 'min-[1000px]:flex-1' : undefined"
          >
            <BranchPickerDropdown
              v-if="isSuperAdmin"
              :model-value="selectedBranchId"
              :branches="branches"
              :loading="branchesLoading"
              :disabled="insightLoading"
              :show-all-branches-option="showAllBranchesOption"
              @update:model-value="(id) => setPageBranchFilter(id, { resetPage: true })"
            />
            <ProcurementInsightDateFilter
              :model-value="insightDateFilter"
              @update:model-value="onInsightDateFilterChange"
            />
          </div>
          <div class="flex items-center justify-between gap-3 min-[1000px]:shrink-0 min-[1000px]:justify-end">
            <p class="text-sm text-grey-300 min-[1000px]:text-right">
              {{ insightCountLabel }} · {{ insightPeriodLabelText }}
            </p>
            <ViewToggle
              v-if="!isCompactViewport"
              class="shrink-0"
              :model-value="insightRouteView"
              @update:model-value="setInsightView"
            />
          </div>
        </div>

        <div
          v-if="!insightBranchId"
          class="rounded-[24px] border border-dashed border-grey-50 bg-background-on-canvas px-6 py-12 text-center"
        >
          <p class="text-base font-medium text-grey-900">
            Select a branch
          </p>
          <p class="mt-2 text-sm text-grey-300">
            Choose a branch to view product procurement insight for the selected period.
          </p>
        </div>

        <template v-else>
          <ProcurementInsightTable
            v-if="insightEffectiveView === 'table'"
            :rows="paginatedInsightRows"
            :page="insightMeta.page"
            :total-pages="insightMeta.totalPages"
            :total-items="insightMeta.total"
            :page-size="insightMeta.limit"
            :has-next-page="insightMeta.hasNextPage"
            :has-prev-page="insightMeta.hasPrevPage"
            :loading="insightLoading"
            :period-label="insightPeriodLabelText"
            @page="setInsightPage"
            @page-size="setInsightLimit"
          />

          <div v-else-if="!insightLoading" class="space-y-4">
            <ProcurementInsightCards
              v-if="paginatedInsightRows.length"
              :rows="paginatedInsightRows"
            />

            <div
              v-else
              class="rounded-[24px] border border-dashed border-grey-50 bg-background-on-canvas px-6 py-12 text-center"
            >
              <p class="text-base font-medium text-grey-900">
                No procurement data
              </p>
              <p class="mt-2 text-sm text-grey-300">
                Products you order will appear here once orders are placed in the selected period.
              </p>
              <p class="mt-1 text-xs text-grey-300">
                Period: {{ insightPeriodLabelText }}
              </p>
            </div>

            <PaginationBar
              v-if="insightMeta.total > 0"
              plain
              :page="insightMeta.page"
              :total-pages="insightMeta.totalPages"
              :total-items="insightMeta.total"
              :page-size="insightMeta.limit"
              :has-next-page="insightMeta.hasNextPage"
              :has-prev-page="insightMeta.hasPrevPage"
              @change="setInsightPage"
              @page-size-change="setInsightLimit"
            />
          </div>

          <div v-else class="flex flex-wrap gap-4">
            <div
              v-for="index in 3"
              :key="`insight-card-skeleton-${index}`"
              class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-5"
            >
              <div class="space-y-2">
                <div class="h-5 w-3/4 animate-pulse rounded bg-grey-55" />
                <div class="h-4 w-full animate-pulse rounded bg-grey-55" />
              </div>
              <div class="mt-4 h-2 animate-pulse rounded-full bg-grey-55" />
              <div class="mt-5 grid grid-cols-2 gap-3">
                <div
                  v-for="cardIndex in 4"
                  :key="cardIndex"
                  class="h-16 animate-pulse rounded-[18px] bg-grey-55"
                />
              </div>
            </div>
          </div>
        </template>
      </div>

      <div v-show="activeTab === 'orders'" class="flex flex-col gap-6">
        <div
          class="flex w-full flex-col gap-3 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between"
        >
          <div
            class="flex w-full flex-col gap-3 min-[1000px]:max-w-md"
            :class="isSuperAdmin ? 'min-[1000px]:flex-1' : undefined"
          >
            <BranchPickerDropdown
              v-if="isSuperAdmin"
              :model-value="selectedBranchId"
              :branches="branches"
              :loading="branchesLoading"
              :disabled="ordersLoading"
              :show-all-branches-option="showAllBranchesOption"
              @update:model-value="(id) => setPageBranchFilter(id, { resetPage: true })"
            />
            <SearchField
              v-model="searchValue"
              placeholder="Search by product name or reference"
              :disabled="ordersLoading"
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
          :loading="ordersLoading"
          :reorder-loading="reordering"
          :reorder-loading-order-id="reorderLoadingOrderId"
          :empty-title="`No ${emptyStateStatusLabel} orders`"
          empty-description="Orders appear here after a request is approved and paid at checkout."
          @page="setPage"
          @page-size="setLimit"
          @row-click="openOrder"
          @view-details="openOrder"
          @reorder="(order) => handleReorder(order.id)"
        />

        <div v-else-if="!ordersLoading" class="space-y-4">
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
            class="rounded-[24px] border border-dashed border-grey-50 bg-background-on-canvas px-6 py-12 text-center"
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
            class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-5"
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
  </div>
</template>
