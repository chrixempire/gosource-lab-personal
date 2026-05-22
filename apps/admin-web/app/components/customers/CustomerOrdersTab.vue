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
import CustomerOrderHistoryFilterBar, {
  type CustomerOrderHistoryFilters,
} from '~/components/customers/CustomerOrderHistoryFilterBar.vue';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { parseCustomerOrdersResponse } from '~/lib/customer-api';

const props = defineProps<{
  customerId: string;
  totalOrders?: number;
  totalSpent?: number;
}>();

const page = ref(1);
const limit = ref(10);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const filters = ref<CustomerOrderHistoryFilters>({
  amountMin: '',
  amountMax: '',
  paymentStatus: [],
  status: [],
  startDate: '',
  endDate: '',
});

const query = computed(() => ({
  page: page.value,
  limit: limit.value,
  ...(debouncedSearch.value.trim() && { reference: debouncedSearch.value.trim() }),
  ...(filters.value.amountMin.trim() && { amountFrom: Number(filters.value.amountMin) }),
  ...(filters.value.amountMax.trim() && { amountTo: Number(filters.value.amountMax) }),
  ...(filters.value.startDate && { dateFrom: filters.value.startDate }),
  ...(filters.value.endDate && { dateTo: filters.value.endDate }),
  ...(filters.value.status.length > 0 && { status: filters.value.status }),
  ...(filters.value.paymentStatus.length > 0 && { paymentStatus: filters.value.paymentStatus }),
}));

const { data, pending, error, refresh } = useFetch<unknown>(
  () => `/api/customers/${props.customerId}/orders`,
  { query, watch: [() => props.customerId, query] },
);

const parsed = computed(() => parseCustomerOrdersResponse(data.value, page.value, limit.value));

const gridTemplate =
  'minmax(0,0.95fr) minmax(0,0.85fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.75fr) minmax(0,0.75fr)';

function applyFilters(next: Partial<CustomerOrderHistoryFilters>) {
  filters.value = { ...filters.value, ...next };
  page.value = 1;
}

function clearAll() {
  filters.value = {
    amountMin: '',
    amountMax: '',
    paymentStatus: [],
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
</script>

<template>
  <div class="space-y-5">
    <div v-if="pending" class="space-y-5">
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="index in 2"
          :key="`order-stat-${index}`"
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
            v-for="index in 4"
            :key="`order-filter-${index}`"
            class="h-9 w-24 animate-pulse rounded-full bg-grey-55"
          />
        </div>
      </div>

      <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
        <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
          <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
            <TableCell>Reference</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Payment</TableCell>
          </TableHeadRow>
        </TableHeader>
        <div class="p-4">
          <TableSkeleton
            :columns="Array(6).fill({ kind: 'line' as const, lineClass: 'w-full' })"
            :grid-template-columns="gridTemplate"
            :row-count="10"
          />
        </div>
      </TableShell>
    </div>

    <template v-else>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-grey-50 bg-white px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Total spent</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">
          {{ formatDashboardCurrency(totalSpent ?? 0) }}
        </p>
      </div>
      <div class="rounded-xl border border-grey-50 bg-white px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Total orders</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">
          {{ totalOrders ?? 0 }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <SearchField
        v-model="searchQuery"
        placeholder="Search orders"
        class="max-w-[20rem]"
      />
      <CustomerOrderHistoryFilterBar
        :filters="filters"
        @apply="applyFilters"
        @clear-all="clearAll"
      />
    </div>

    <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
      <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
        <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
          <TableCell>Reference</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Items</TableCell>
          <TableCell>Total</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Payment</TableCell>
        </TableHeadRow>
      </TableHeader>

      <TableBody class="!max-h-none !overflow-visible">
        <TableRow
          v-if="error && parsed.rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-6 py-10 text-center">
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-800">Unable to load order history</p>
              <button type="button" class="text-sm font-medium text-primary-700" @click="refresh()">
                Retry
              </button>
            </div>
          </TableCell>
        </TableRow>

        <TableRow
          v-else-if="parsed.rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-6 py-10 text-center text-sm text-grey-500">
            No orders found
          </TableCell>
        </TableRow>

        <template v-else>
          <TableRow
            v-for="order in parsed.rows"
            :key="order.id"
            class="cursor-pointer hover:bg-primary-50/40"
            :style="{ gridTemplateColumns: gridTemplate }"
            @click="navigateTo(`${ADMIN_PAGE_ROUTES.ORDERS}/${order.id}`)"
          >
            <TableCell>
              <p class="text-sm font-medium text-grey-900">{{ order.referenceLabel }}</p>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">{{ order.createdLabel }}</p>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">{{ order.itemCountLabel }}</p>
            </TableCell>
            <TableCell>
              <p class="text-sm font-medium text-grey-900">{{ order.totalLabel }}</p>
            </TableCell>
            <TableCell>
              <StatusTag :variant="order.statusVariant" size="medium">
                {{ order.statusLabel }}
              </StatusTag>
            </TableCell>
            <TableCell>
              <StatusTag :variant="order.paymentStatusVariant" size="medium">
                {{ order.paymentStatusLabel }}
              </StatusTag>
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
