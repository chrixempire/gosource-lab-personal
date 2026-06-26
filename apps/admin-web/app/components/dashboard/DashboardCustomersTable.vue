<script setup lang="ts">
import {
  PaginationBar,
  SegmentedControl,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import DashboardCustomerRankCards from '~/components/dashboard/DashboardCustomerRankCards.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminCompactViewport } from '~/composables/useAdminCompactViewport';
import { parseCustomerRankingResponse } from '~/lib/dashboard-api';
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  toDashboardQueryParams,
} from '~/lib/dashboard-date';
import type {
  DashboardDateFilterValue,
  DashboardRankedCustomer,
  DashboardTableMeta,
} from '~/types/dashboard';

const props = defineProps<{
  filter: DashboardDateFilterValue;
}>();

const isCompactViewport = useAdminCompactViewport();

const tableGridTemplate =
  '3.5rem minmax(0, 1.5fr) minmax(0, 0.55fr) minmax(0, 0.75fr)';

const skeletonColumns = [
  { kind: 'line' as const, lineClass: 'w-8' },
  {
    kind: 'stack' as const,
    lineClass: 'w-full',
    sublineClass: 'w-4/5',
  },
  { kind: 'line' as const, lineClass: 'w-12' },
  { kind: 'line' as const, lineClass: 'w-24' },
];

const rankingMode = ref<'best' | 'least'>('best');
const rankingOptions = [
  { label: 'Best', value: 'best' },
  { label: 'Least', value: 'least' },
] as const;
const DASHBOARD_TABLE_PAGE_SIZE = 5;

const page = ref(1);
const pageSize = ref(DASHBOARD_TABLE_PAGE_SIZE);
watch(
  () => [props.filter, rankingMode.value] as const,
  () => {
    page.value = 1;
  },
  { deep: true },
);

watch(pageSize, () => {
  page.value = 1;
});

const query = computed(() => ({
  ...toDashboardQueryParams(props.filter),
  sortOrder: rankingMode.value === 'best' ? 'desc' : 'asc',
  page: page.value,
  limit: pageSize.value,
}));

const { data, pending, error, refresh } = await useAdminAuthenticatedFetch<unknown>(
  '/api/dashboard/customer-ranking',
  {
    query,
    watch: [query],
    key: 'admin-dashboard-customer-ranking',
  },
);

const parsed = computed(() =>
  parseCustomerRankingResponse(data.value, page.value, pageSize.value),
);

const rows = computed(() => parsed.value.rows);
const meta = computed<DashboardTableMeta>(() => parsed.value.meta);
const initialLoading = computed(() => pending.value);
</script>

<template>
  <TableShell
    class="flex w-full min-w-0 max-w-full flex-col overflow-visible rounded-xl border border-grey-50 bg-white shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)] min-[1000px]:min-h-[28rem]"
  >
    <div
      class="flex flex-col gap-3 border-b border-grey-50 px-4 py-4 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between min-[1000px]:px-5"
    >
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-grey-900">Customer patronage</h3>
        <p class="text-sm text-grey-300">Best and least patronizing customers in the selected period.</p>
      </div>
      <SegmentedControl
        v-model="rankingMode"
        :options="[...rankingOptions]"
        class="w-full min-[1000px]:w-auto"
      />
    </div>

    <template v-if="!isCompactViewport">
      <div v-if="initialLoading" class="flex min-h-0 flex-1 flex-col border-t border-grey-50">
        <TableSkeleton
          :columns="skeletonColumns"
          :grid-template-columns="tableGridTemplate"
          :row-count="10"
        />
      </div>

      <div v-else class="flex min-h-0 flex-1 flex-col border-t border-grey-50">
        <TableHeader
          class="sticky -top-8 z-30 shrink-0 overflow-hidden border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
        >
          <TableHeadRow :style="{ gridTemplateColumns: tableGridTemplate }">
            <TableCell>S/N</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Orders</TableCell>
            <TableCell>Total spent</TableCell>
          </TableHeadRow>
        </TableHeader>

        <TableBody class="!max-h-none !overflow-visible pt-0">
          <TableRow
            v-if="error || !rows.length"
            class="min-h-[15rem]"
            :style="{ gridTemplateColumns: tableGridTemplate }"
          >
            <TableCell class="col-span-4 h-full py-0 text-center">
              <div class="flex h-full min-h-[15rem] items-center justify-center">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-grey-800">
                    {{ error ? 'Unable to load customers' : 'No customer orders' }}
                  </p>
                  <p class="text-sm text-grey-400">
                    {{
                      error
                        ? 'Check your permissions for customer views.'
                        : 'No customer orders were recorded in this period.'
                    }}
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>

          <TableRow
            v-for="(row, index) in rows"
            :key="String(row.customerId)"
            :style="{ gridTemplateColumns: tableGridTemplate }"
            class="bg-white"
          >
            <TableCell class="text-sm text-grey-300">
              {{ (meta.page - 1) * meta.limit + index + 1 }}
            </TableCell>
            <TableCell>
              <div class="min-w-0">
                <p class="truncate font-medium text-grey-900">{{ row.businessName ?? '—' }}</p>
                <p v-if="row.email" class="mt-0.5 truncate text-xs text-grey-300">{{ row.email }}</p>
              </div>
            </TableCell>
            <TableCell>{{ formatDashboardNumber(row.totalOrders) }}</TableCell>
            <TableCell>{{ formatDashboardCurrency(row.totalSpent) }}</TableCell>
          </TableRow>
        </TableBody>

        <TableFooter
          v-if="rows.length > 0"
          class="mt-auto shrink-0 border-t border-grey-50 bg-white px-2 py-2"
        >
          <PaginationBar
            :page="meta.page"
            :page-size="meta.limit"
            :total-pages="meta.totalPages"
            :total-items="meta.total"
            :has-next-page="meta.hasNext"
            :has-prev-page="meta.hasPrev"
            @change="page = $event"
            @page-size-change="pageSize = $event"
          />
        </TableFooter>
      </div>
    </template>

    <template v-else>
      <div v-if="initialLoading" class="space-y-3 border-t border-grey-50 p-4">
        <div
          v-for="index in 3"
          :key="index"
          class="h-28 animate-pulse rounded-2xl bg-grey-55"
        />
      </div>

      <div
        v-else-if="error || !rows.length"
        class="flex items-center justify-center border-t border-grey-50 p-5"
      >
        <LoadErrorState
          v-if="error"
          :error="error"
          load-failed-title="Unable to load customers"
          resource-label="customer ranking"
          fallback-message="Check your permissions for customer views, then retry."
          @retry="refresh()"
        />
        <EmptyState
          v-else
          class="border-none bg-transparent shadow-none"
          title="No customer orders"
          description="No customer orders were recorded in this period."
        />
      </div>

      <template v-else>
        <div class="flex min-w-0 flex-col">
          <DashboardCustomerRankCards :rows="rows" :meta="meta" />
          <TableFooter
            v-if="rows.length > 0"
            class="shrink-0 border-t border-grey-50 bg-white px-2 py-2"
          >
            <PaginationBar
              :page="meta.page"
              :page-size="meta.limit"
              :total-pages="meta.totalPages"
              :total-items="meta.total"
              :has-next-page="meta.hasNext"
              :has-prev-page="meta.hasPrev"
              @change="page = $event"
              @page-size-change="pageSize = $event"
            />
          </TableFooter>
        </div>
      </template>
    </template>
  </TableShell>
</template>
