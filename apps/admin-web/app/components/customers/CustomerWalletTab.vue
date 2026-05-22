<script setup lang="ts">
import {
  PaginationBar,
  SearchField,
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
import CustomerWalletFilterBar, {
  type CustomerWalletTabFilters,
} from '~/components/customers/CustomerWalletFilterBar.vue';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { parseCustomerTransactions } from '~/lib/customer-api';

const props = defineProps<{
  customerId: string;
  walletBalance?: number | null;
}>();

const page = ref(1);
const limit = ref(10);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const filters = ref<CustomerWalletTabFilters>({
  amountMin: '',
  amountMax: '',
  status: [],
  startDate: '',
  endDate: '',
});

const query = computed(() => ({
  page: page.value,
  limit: limit.value,
  ...(debouncedSearch.value.trim() && { name: debouncedSearch.value.trim() }),
  ...(filters.value.amountMin.trim() && { amountFrom: Number(filters.value.amountMin) }),
  ...(filters.value.amountMax.trim() && { amountTo: Number(filters.value.amountMax) }),
  ...(filters.value.startDate && { startDate: filters.value.startDate }),
  ...(filters.value.endDate && { endDate: filters.value.endDate }),
  ...(filters.value.status.length > 0 && { status: filters.value.status }),
}));

const { data, pending, error, refresh } = useFetch<unknown>(
  () => `/api/customers/${props.customerId}/transactions`,
  { query, watch: [() => props.customerId, query] },
);

const parsed = computed(() => parseCustomerTransactions(data.value, page.value, limit.value));

const totalTransactions = computed(() => parsed.value.meta.total);

const gridTemplate =
  'minmax(0,1.25fr) minmax(0,0.9fr) minmax(0,0.75fr) minmax(0,0.8fr) minmax(0,0.8fr)';

function applyFilters(next: Partial<CustomerWalletTabFilters>) {
  filters.value = { ...filters.value, ...next };
  page.value = 1;
}

function clearAll() {
  filters.value = {
    amountMin: '',
    amountMax: '',
    status: [],
    startDate: '',
    endDate: '',
  };
  page.value = 1;
}

function onPageSizeChange(next: number) {
  limit.value = next;
  page.value = 1;
}

function statusVariant(label: string) {
  if (label === 'Successful') return 'success';
  if (label === 'Cancelled') return 'negative';
  return 'warning';
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="pending" class="space-y-5">
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="index in 2"
          :key="`wallet-stat-${index}`"
          class="rounded-xl border border-grey-50 bg-white px-4 py-4"
        >
          <div class="h-3 w-24 animate-pulse rounded bg-grey-55" />
          <div class="mt-3 h-10 w-32 animate-pulse rounded bg-grey-55" />
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="h-11 max-w-[20rem] animate-pulse rounded-xl bg-grey-55" />
        <div class="flex flex-wrap gap-2">
          <div
            v-for="index in 3"
            :key="`wallet-filter-${index}`"
            class="h-9 w-24 animate-pulse rounded-full bg-grey-55"
          />
        </div>
      </div>

      <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
        <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
          <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
            <TableCell>Title</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableHeadRow>
        </TableHeader>
        <div class="p-4">
          <TableSkeleton
            :columns="Array(5).fill({ kind: 'line' as const, lineClass: 'w-full' })"
            :grid-template-columns="gridTemplate"
            :row-count="10"
          />
        </div>
      </TableShell>
    </div>

    <template v-else>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-grey-50 bg-white px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Wallet balance</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">
          {{ formatDashboardCurrency(walletBalance ?? 0) }}
        </p>
      </div>
      <div class="rounded-xl border border-grey-50 bg-white px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Total transactions</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">
          {{ totalTransactions }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <SearchField
        v-model="searchQuery"
        placeholder="Search transactions"
        class="max-w-[20rem]"
      />
      <CustomerWalletFilterBar
        :filters="filters"
        @apply="applyFilters"
        @clear-all="clearAll"
      />
    </div>

    <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
      <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
        <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
          <TableCell>Title</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Date</TableCell>
        </TableHeadRow>
      </TableHeader>

      <TableBody class="!max-h-none !overflow-visible">
        <TableRow
          v-if="error && parsed.rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-5 py-10 text-center">
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-800">Unable to load wallet activity</p>
              <button
                type="button"
                class="text-sm font-medium text-primary-700"
                @click="refresh()"
              >
                Retry
              </button>
            </div>
          </TableCell>
        </TableRow>

        <TableRow
          v-else-if="parsed.rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-5 py-10 text-center text-sm text-grey-500">
            No transactions found
          </TableCell>
        </TableRow>

        <template v-else>
          <TableRow
            v-for="row in parsed.rows"
            :key="row.id"
            :style="{ gridTemplateColumns: gridTemplate }"
          >
            <TableCell>
              <div class="space-y-1">
                <p class="text-sm font-medium text-grey-900">
                  {{ row.description }} - #{{ row.reference }}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <p class="text-sm font-medium text-grey-900">{{ row.amountLabel }}</p>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">{{ row.typeLabel }}</p>
            </TableCell>
            <TableCell>
              <StatusTag :variant="statusVariant(row.statusLabel)" size="medium">
                {{ row.statusLabel }}
              </StatusTag>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">{{ row.createdAtLabel }}</p>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>

      <TableFooter v-if="!pending && parsed.meta.total > 0">
        <PaginationBar
          :page="parsed.meta.page"
          :page-size="parsed.meta.limit"
          :total-pages="parsed.meta.totalPages"
          :total-items="parsed.meta.total"
          :has-next-page="parsed.meta.hasNext"
          :has-prev-page="parsed.meta.hasPrev"
          @change="page = $event"
          @page-size-change="onPageSizeChange"
        />
      </TableFooter>
    </TableShell>
    </template>
  </div>
</template>
