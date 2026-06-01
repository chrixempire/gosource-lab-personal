<script setup lang="ts">
import type { CustomerMeResponse, OrderRecord } from '@gosource/api-client';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import BusinessInsightBranchSpendChart from '~/components/business-insight/BusinessInsightBranchSpendChart.vue';
import BusinessInsightKpiCards from '~/components/business-insight/BusinessInsightKpiCards.vue';
import BusinessInsightMonthlyInsight from '~/components/business-insight/BusinessInsightMonthlyInsight.vue';
import BusinessInsightSpendTrendChart from '~/components/business-insight/BusinessInsightSpendTrendChart.vue';
import ExploreLastOrderCard from '~/components/explore/ExploreLastOrderCard.vue';
import ExploreLastOrderCardSkeleton from '~/components/explore/ExploreLastOrderCardSkeleton.vue';
import OrderTable from '~/components/orders/OrderTable.vue';
import { Button } from '@gosource/ui';
import ProcurementInsightDateFilter from '~/components/orders/ProcurementInsightDateFilter.vue';
import ProcurementInsightTable from '~/components/orders/ProcurementInsightTable.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useBusinessInsightHero } from '~/composables/useBusinessInsightHero';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { usePageBranchFilter } from '~/composables/usePageBranchFilter';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { isAllBranchesFilter } from '~/lib/branch-picker';
import {
  computePeriodMetricsFromOrders,
  fetchOrdersForInsightMetrics,
  mergeBranchSpendWithBusinessBranches,
  parseBranchPerformancePayload,
  pickMostRecentOrders,
} from '~/lib/business-insight-metrics';
import {
  fetchProcurementInsightForBranch,
  mergeProcurementItemsAcrossBranches,
  sumProcuredItemSpend,
} from '~/lib/explore-procurement-insight';
import { buildProcurementInsightTableRowsFromProcuredItems } from '~/lib/procurement-insight-table';
import {
  insightDateFilterToRouteQuery,
  insightPeriodLabel,
  parseInsightDateFilterFromQuery,
  resolveInsightDateRange,
  type InsightDateFilterValue,
} from '~/lib/insight-date-filter';
import {
  BUSINESS_INSIGHT_DEFAULT_PAGE_SIZE,
  buildInsightPaginationMeta,
  insightPaginationToRouteQuery,
  paginateInsightRows,
  parseInsightPaginationFromQuery,
} from '~/lib/insight-table-pagination';
import { mapOrderToListItem, type OrderListItem } from '~/lib/order-details';
import { useCustomerAnalyticsService } from '~/services/analytics.service';
import { useCustomerOrderService } from '~/services/order.service';

const RECENT_ORDERS_LIMIT = 5;

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));
const route = useRoute();
const router = useRouter();

const pageBranch = usePageBranchFilter();
const {
  viewBranchId: selectedBranchId,
  apiBranchId,
  branches,
  branchesLoading,
  showAllBranchesOption,
  activeBranchId,
  setPageBranchFilter,
  ensureBranchesLoaded,
} = pageBranch;

const insightDateFilter = computed(() => parseInsightDateFilterFromQuery(route.query));
const insightPeriodLabelText = computed(() => insightPeriodLabel(insightDateFilter.value));
const insightDateRange = computed(() => resolveInsightDateRange(insightDateFilter.value));
const insightPagination = computed(() =>
  parseInsightPaginationFromQuery(route.query, {
    defaultLimit: BUSINESS_INSIGHT_DEFAULT_PAGE_SIZE,
  }),
);

const viewingAllBranches = computed(() => isAllBranchesFilter(apiBranchId.value ?? ''));

/** Single branch for hero cards when “All branches” is selected. */
const resolvedHeroBranchId = computed(() => apiBranchId.value || activeBranchId.value || undefined);

const readOnlyBranchLabel = computed(() => {
  const branch = branches.value.find((entry) => entry.id === resolvedHeroBranchId.value);
  if (!branch) {
    return 'Branch';
  }

  return `${branch.branchName}${branch.isHeadquarter ? ' (Headquarter)' : ''}`;
});

const {
  lastOrder,
  insight: heroInsight,
  loaded: heroLoaded,
  pending: heroPending,
} = useBusinessInsightHero(resolvedHeroBranchId);

const { listOrders } = useCustomerOrderService();
const { getTotalProcurement, getTopProcuredItems, getProductAnalysis, getBranchPerformance } =
  useCustomerAnalyticsService();

function onBranchFilterChange(branchId: string) {
  setPageBranchFilter(branchId, { resetPage: true });
}

function onInsightDateFilterChange(next: InsightDateFilterValue) {
  router.replace({
    query: {
      ...route.query,
      ...insightDateFilterToRouteQuery(next),
      insightPage: '1',
    },
  });
}

function replaceInsightPagination(page: number, limit: number) {
  router.replace({
    query: {
      ...route.query,
      ...insightPaginationToRouteQuery(page, limit),
    },
  });
}

const {
  data: analyticsPayload,
  pending: analyticsPending,
} = await useAuthenticatedAsyncData(
  'business-insight-analytics',
  async () => {
    const range = insightDateRange.value;
    const branchId = apiBranchId.value;

    const orders = await fetchOrdersForInsightMetrics(listOrders, {
      branchId: branchId || undefined,
      range,
    });

    const metrics = computePeriodMetricsFromOrders(orders, insightDateFilter.value);

    let branchSpend = metrics.branchSpend;
    if (viewingAllBranches.value) {
      const performance = await getBranchPerformance({ quiet: true });
      const fromApi = parseBranchPerformancePayload(performance);
      if (fromApi.length > 0) {
        branchSpend = fromApi;
      }
    }

    return {
      metrics: {
        ...metrics,
        branchSpend,
      },
      recentOrders: pickMostRecentOrders(orders, RECENT_ORDERS_LIMIT),
    };
  },
  {
    watch: [
      apiBranchId,
      () => insightDateRange.value.startDate,
      () => insightDateRange.value.endDate,
      () => insightDateFilter.value.filterType,
    ],
  },
);

const {
  data: productTablePayload,
  pending: productTablePending,
} = await useAuthenticatedAsyncData(
  'business-insight-products',
  async () => {
    const range = insightDateRange.value;

    if (viewingAllBranches.value) {
      const orders = await fetchOrdersForInsightMetrics(listOrders, { range });
      const branchIdsInPeriod = [
        ...new Set(
          orders
            .map((order) => order.branchId?.trim())
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      if (branchIdsInPeriod.length === 0) {
        return { rows: [] };
      }

      const branchNameById = new Map(branches.value.map((branch) => [branch.id, branch.branchName]));
      const deps = {
        listOrders,
        getTotalProcurement,
        getTopProcuredItems,
        getProductAnalysis,
      };

      const branchResults = await Promise.all(
        branchIdsInPeriod.map(async (branchId) => {
          const { items } = await fetchProcurementInsightForBranch(deps, branchId, range);
          const orderBranchName = orders.find((order) => order.branchId === branchId)?.branchName;

          return {
            branchId,
            branchName: branchNameById.get(branchId) ?? orderBranchName ?? 'Unknown branch',
            items,
          };
        }),
      );

      const items = mergeProcurementItemsAcrossBranches(branchResults);
      const totalSpent = sumProcuredItemSpend(items);

      return {
        rows: buildProcurementInsightTableRowsFromProcuredItems(items, totalSpent),
      };
    }

    const branchId = apiBranchId.value;
    if (!branchId) {
      return { rows: [] };
    }

    const { items, totalSpent } = await fetchProcurementInsightForBranch(
      { listOrders, getTotalProcurement, getTopProcuredItems, getProductAnalysis },
      branchId,
      range,
    );

    const branchName =
      branches.value.find((branch) => branch.id === branchId)?.branchName ?? 'Unknown branch';
    const itemsWithBranch = items.map((item) => ({ ...item, branchName }));

    return {
      rows: buildProcurementInsightTableRowsFromProcuredItems(itemsWithBranch, totalSpent),
    };
  },
  {
    watch: [
      apiBranchId,
      viewingAllBranches,
      () => insightDateRange.value.startDate,
      () => insightDateRange.value.endDate,
      () => insightDateFilter.value.filterType,
    ],
  },
);

const periodMetrics = computed(() => analyticsPayload.value?.metrics);
const recentOrderRecords = computed(() => analyticsPayload.value?.recentOrders ?? []);

const productRows = computed(() => productTablePayload.value?.rows ?? []);
const productMeta = computed(() =>
  buildInsightPaginationMeta(
    productRows.value.length,
    insightPagination.value.page,
    insightPagination.value.limit,
  ),
);
const paginatedProductRows = computed(() =>
  paginateInsightRows(productRows.value, productMeta.value.page, productMeta.value.limit),
);

const recentOrderItems = computed<OrderListItem[]>(() =>
  recentOrderRecords.value.map((order: OrderRecord) => mapOrderToListItem(order)),
);

const showBranchChart = computed(() => viewingAllBranches.value);

const branchSpendChartRows = computed(() =>
  mergeBranchSpendWithBusinessBranches(branches.value, periodMetrics.value?.branchSpend ?? []),
);

const branchChartPending = computed(
  () =>
    analyticsPending.value ||
    (branchesLoading.value && branchSpendChartRows.value.length === 0),
);

const { whenReady } = useCustomerSession();

if (import.meta.client) {
  onMounted(async () => {
    await whenReady();
    await ensureBranchesLoaded(true);
  });
}

useHead({ title: 'Business insight' });
</script>

<template>
  <div class="flex flex-col gap-2 pb-10">
    <section
      class="flex flex-col gap-2 min-[720px]:flex-row min-[720px]:flex-nowrap min-[720px]:items-end"
    >
      <BranchPickerDropdown
        v-if="isSuperAdmin"
        :model-value="selectedBranchId"
        :branches="branches"
        :loading="branchesLoading"
        :disabled="analyticsPending || productTablePending"
        :show-all-branches-option="showAllBranchesOption"
        class="w-full min-[720px]:w-fit min-[720px]:shrink-0"
        @update:model-value="onBranchFilterChange"
      />
      <div v-else class="w-full min-[720px]:w-fit min-[720px]:shrink-0">
        <Button
          variant="primary"
          size="small"
          class="!w-fit max-w-full shrink-0 whitespace-nowrap"
          disabled
        >
          <span class="min-w-0 truncate">{{ readOnlyBranchLabel }}</span>
        </Button>
      </div>
      <ProcurementInsightDateFilter
        :model-value="insightDateFilter"
        class="w-full min-[720px]:w-fit min-[720px]:shrink-0"
        @update:model-value="onInsightDateFilterChange"
      />
    </section>

    <section class="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-2">
      <div class="flex min-w-0 flex-col">
        <ExploreLastOrderCard
          v-if="!heroPending && lastOrder"
          :order="lastOrder"
          class="h-full min-h-[260px]"
        />
        <ExploreLastOrderCardSkeleton v-else-if="heroPending" class="h-full min-h-[260px]" />
        <article
          v-else-if="heroLoaded"
          class="flex h-full min-h-[260px] flex-col rounded-[24px] border border-dashed border-grey-100 bg-grey-55/50 p-5 dark:border-grey-50"
        >
          <p class="text-base font-semibold text-grey-900">No recent orders yet</p>
          <p class="mt-1 text-sm text-grey-300">
            Your last basket will appear here after this branch places an order.
          </p>
        </article>
      </div>

      <div class="flex min-w-0 flex-col">
        <BusinessInsightMonthlyInsight
          class="h-full min-h-[260px]"
          :insight="heroInsight"
          :loading="heroPending"
          :loaded="heroLoaded"
        />
      </div>
    </section>

    <BusinessInsightKpiCards
      :total-spend="periodMetrics?.totalSpend ?? 0"
      :order-count="periodMetrics?.orderCount ?? 0"
      :average-order-value="periodMetrics?.averageOrderValue ?? 0"
      :pending="analyticsPending"
    />

    <div class="flex w-full flex-col gap-2">
      <BusinessInsightBranchSpendChart
        v-if="showBranchChart"
        :rows="branchSpendChartRows"
        :pending="branchChartPending"
      />
      <BusinessInsightSpendTrendChart
        :points="periodMetrics?.dailySpend ?? []"
        :filter-type="insightDateFilter.filterType"
        :pending="analyticsPending"
      />
    </div>

    <section class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-grey-900">Spend by product</h2>
        <p class="text-sm text-grey-300">{{ productRows.length }} products</p>
      </div>

      <div
        v-if="!apiBranchId && !viewingAllBranches"
        class="rounded-[16px] border border-dashed border-grey-50 bg-background-on-canvas px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">Select a branch</p>
        <p class="mt-2 text-sm text-grey-300">
          Choose a branch to view product line items for {{ insightPeriodLabelText }}.
        </p>
      </div>

      <ProcurementInsightTable
        v-else
        show-branch-column
        :rows="paginatedProductRows"
        :page="productMeta.page"
        :total-pages="productMeta.totalPages"
        :total-items="productMeta.total"
        :page-size="productMeta.limit"
        :has-next-page="productMeta.hasNextPage"
        :has-prev-page="productMeta.hasPrevPage"
        :loading="productTablePending"
        :period-label="insightPeriodLabelText"
        empty-title="No product spend"
        :empty-description="
          viewingAllBranches
            ? 'No procured products across your branches in this period.'
            : 'No procured products in this period for the selected branch.'
        "
        @page="(p) => replaceInsightPagination(p, productMeta.limit)"
        @page-size="(limit) => replaceInsightPagination(1, limit)"
      />
    </section>

    <section class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-grey-900">Recent orders</h2>
        <NuxtLink
          to="/track-orders?tab=orders"
          class="text-sm font-semibold text-primary-500 underline-offset-2 hover:underline"
        >
          View all
        </NuxtLink>
      </div>

      <OrderTable
        hide-actions
        hide-pagination
        :orders="recentOrderItems"
        :page="1"
        :total-pages="1"
        :total-items="recentOrderItems.length"
        :page-size="RECENT_ORDERS_LIMIT"
        :loading="analyticsPending"
        :period-label="insightPeriodLabelText"
        empty-title="No recent orders"
        empty-description="No orders were placed in the selected period."
        @row-click="(order) => navigateTo(`/track-orders/${order.id}`)"
      />
    </section>
  </div>
</template>
