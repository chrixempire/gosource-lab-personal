<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SearchField,
  StatCard,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import CustomerCreditHistoryFilterBar from '~/components/customers/CustomerCreditHistoryFilterBar.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { creditRequestPath } from '~/lib/admin-routes';
import {
  formatCreditFromKobo,
  parseCustomerCreditHistory,
  parseCustomerCreditSummary,
} from '~/lib/credit-api';
import { creditStatusVariant } from '~/lib/credit-constants';
import {
  customerCreditHistoryFiltersToApiQuery,
  type CustomerCreditHistoryFilters,
} from '~/lib/credit-filters';
import { CREDIT_LIST_SEARCH_CLASS, CREDIT_LIST_TOOLBAR_CLASS } from '~/lib/credit-page-layout';
import {
  CREDIT_LIST_PANEL_CLASS,
  CUSTOMER_CREDIT_HISTORY_TABLE_GRID,
} from '~/lib/credit-table-layout';

const props = defineProps<{
  customerId: string;
}>();

const customerId = toRef(props, 'customerId');

const filters = ref<CustomerCreditHistoryFilters>({
  page: 1,
  limit: 10,
  search: '',
  requestType: [],
  tenure: [],
  status: [],
  startDate: '',
  endDate: '',
});

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);

const apiQuery = computed(() => customerCreditHistoryFiltersToApiQuery(filters.value));

const { data: summaryData, pending: summaryPending } = useFetch<unknown>(
  () => `/api/customers/${customerId.value}/credit-summary`,
  { watch: [customerId] },
);

const { data, pending, error, refresh } = useFetch<unknown>(
  () => `/api/customers/${customerId.value}/credit-history`,
  { query: apiQuery, watch: [apiQuery, customerId] },
);

const showInitialSkeleton = computed(
  () =>
    (summaryPending.value && !summaryData.value) || (pending.value && !data.value),
);

const summary = computed(() => parseCustomerCreditSummary(summaryData.value));
const parsed = computed(() =>
  parseCustomerCreditHistory(data.value, filters.value.page, filters.value.limit),
);

watch(
  () => filters.value.search,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.search) return;
  replaceFilters({ search: trimmed, page: 1 });
});

const statCards = computed(() => [
  {
    title: 'Total credit collected',
    value: formatCreditFromKobo(summary.value.totalCreditCollectedKobo),
  },
  {
    title: 'Total repaid',
    value: formatCreditFromKobo(summary.value.totalRepaidKobo),
  },
  {
    title: 'Active credit',
    value: formatCreditFromKobo(summary.value.creditLimitKobo),
  },
  {
    title: 'Used credit',
    value: formatCreditFromKobo(summary.value.usedCreditKobo),
  },
  {
    title: 'Defaults',
    value: String(summary.value.defaultedCount),
  },
  {
    title: 'Rejected requests',
    value: String(summary.value.rejectedCount),
  },
]);

function replaceFilters(next: Partial<CustomerCreditHistoryFilters>) {
  filters.value = { ...filters.value, ...next };
}

function clearAllFilters() {
  filters.value = {
    page: 1,
    limit: filters.value.limit,
    search: '',
    requestType: [],
    tenure: [],
    status: [],
    startDate: '',
    endDate: '',
  };
  searchQuery.value = '';
}

function onViewDetails(rowId: string) {
  void navigateTo(creditRequestPath(rowId));
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <div v-if="showInitialSkeleton" class="flex flex-col gap-6">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        <div
          v-for="index in 6"
          :key="`credit-stat-skeleton-${index}`"
          class="h-[6.5rem] animate-pulse rounded-xl border border-grey-50 bg-grey-55"
        />
      </div>

      <div class="flex flex-col gap-4">
        <div class="h-11 max-w-[35%] animate-pulse rounded-xl bg-grey-55" />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="index in 4"
            :key="`credit-filter-skeleton-${index}`"
            class="h-9 w-28 animate-pulse rounded-full bg-grey-55"
          />
        </div>
      </div>

      <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
        <TableHeader
          class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
        >
          <TableHeadRow :style="{ gridTemplateColumns: CUSTOMER_CREDIT_HISTORY_TABLE_GRID }">
            <TableCell>Request</TableCell>
            <TableCell>Request type</TableCell>
            <TableCell>Requested amount</TableCell>
            <TableCell>Approved amount</TableCell>
            <TableCell>Repaid amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell />
          </TableHeadRow>
        </TableHeader>
        <div class="p-4">
          <TableSkeleton
            :columns="Array(7).fill({ kind: 'line' as const, lineClass: 'w-full' })"
            :grid-template-columns="CUSTOMER_CREDIT_HISTORY_TABLE_GRID"
            :row-count="10"
          />
        </div>
      </TableShell>
    </div>

    <template v-else>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
      <StatCard
        v-for="card in statCards"
        :key="card.title"
        :label="card.title"
        :value="card.value"
        class="h-full w-full"
      />
    </div>

    <div :class="CREDIT_LIST_TOOLBAR_CLASS">
      <SearchField
        v-model="searchQuery"
        placeholder="Search history"
        :class="CREDIT_LIST_SEARCH_CLASS"
        :disabled="pending && parsed.rows.length === 0"
      />
      <CustomerCreditHistoryFilterBar
        :filters="filters"
        @apply="(next) => replaceFilters({ ...next, page: 1 })"
        @clear-all="clearAllFilters"
      />
    </div>

    <LoadErrorState
      v-if="error && parsed.rows.length === 0"
      :error="error"
      load-failed-title="Unable to load credit history"
      resource-label="credit history"
      @retry="refresh()"
    />

    <TableShell v-else :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
      <TableHeader
        class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
      >
        <TableHeadRow :style="{ gridTemplateColumns: CUSTOMER_CREDIT_HISTORY_TABLE_GRID }">
          <TableCell>Request</TableCell>
          <TableCell>Request type</TableCell>
          <TableCell>Requested amount</TableCell>
          <TableCell>Approved amount</TableCell>
          <TableCell>Repaid amount</TableCell>
          <TableCell>Status</TableCell>
          <TableCell />
        </TableHeadRow>
      </TableHeader>

      <div v-if="pending" class="p-4">
        <TableSkeleton
          :columns="Array(7).fill({ kind: 'line' as const, lineClass: 'w-full' })"
          :grid-template-columns="CUSTOMER_CREDIT_HISTORY_TABLE_GRID"
          :row-count="10"
        />
      </div>

      <TableBody v-else-if="parsed.rows.length" class="!max-h-none !overflow-visible">
        <TableRow
          v-for="row in parsed.rows"
          :key="row.id"
          class="cursor-pointer even:bg-[#FAFBFC]"
          :style="{ gridTemplateColumns: CUSTOMER_CREDIT_HISTORY_TABLE_GRID }"
          @click="onViewDetails(row.id)"
        >
          <TableCell>
            <p class="text-sm font-semibold text-grey-900">{{ row.reference }}</p>
            <p class="mt-1 text-xs text-grey-500">{{ row.createdAtLabel }}</p>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium capitalize text-grey-800">{{ row.requestType }}</p>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium text-grey-800">
              {{ formatCreditFromKobo(row.requestedAmountKobo) }}
            </p>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium text-grey-800">
              {{ formatCreditFromKobo(row.approvedAmountKobo) }}
            </p>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium text-grey-800">
              {{ formatCreditFromKobo(row.repaidAmountKobo) }}
            </p>
          </TableCell>
          <TableCell>
            <StatusTag :variant="creditStatusVariant(row.status)" class="capitalize">
              {{ row.statusLabel }}
            </StatusTag>
          </TableCell>
          <TableCell class="flex justify-end" @click.stop>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <CreditTableActionsTrigger aria-label="Credit history actions" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @select="onViewDetails(row.id)">View details</DropdownMenuItem>
                <DropdownMenuItem disabled>Download invoice</DropdownMenuItem>
                <DropdownMenuItem disabled>Send reminder</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableBody v-else class="!max-h-none !overflow-visible">
        <TableRow :style="{ gridTemplateColumns: CUSTOMER_CREDIT_HISTORY_TABLE_GRID }">
          <TableCell class="col-span-7 py-10 text-center text-sm text-grey-500">
            No credit history available yet
          </TableCell>
        </TableRow>
      </TableBody>

      <TableFooter v-if="!pending && parsed.meta.total > 0">
        <CreditTablePagination
          :meta="parsed.meta"
          @page="replaceFilters({ page: $event })"
          @page-size="replaceFilters({ limit: $event, page: 1 })"
        />
      </TableFooter>
    </TableShell>
    </template>
  </div>
</template>
