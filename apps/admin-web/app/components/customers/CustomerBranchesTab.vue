<script setup lang="ts">
import {
  Avatar,
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
import CustomerBranchFilterBar, {
  type CustomerBranchTabFilters,
} from '~/components/customers/CustomerBranchFilterBar.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { parseCustomerBranches } from '~/lib/customer-api';

const HEADQUARTER_BADGE_STYLE =
  'background: linear-gradient(84deg, #F3A218 8.47%, #A718A7 51.23%, #B81A5B 97.75%)';

function branchInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || '?'
  );
}

function branchAvatarFallbackClass(isInactive: boolean) {
  return isInactive
    ? '!bg-grey-55 !text-grey-400'
    : '!bg-primary-50 !text-primary-700';
}

const props = defineProps<{
  customerId: string;
  totalBranches?: number;
  totalEmployees?: number;
}>();

const page = ref(1);
const limit = ref(10);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const filters = ref<CustomerBranchTabFilters>({
  amountMin: '',
  amountMax: '',
  startDate: '',
  endDate: '',
});

const query = computed(() => ({
  page: page.value,
  limit: limit.value,
  ...(debouncedSearch.value.trim() && { name: debouncedSearch.value.trim() }),
  ...(filters.value.amountMin.trim() && { amountFrom: Number(filters.value.amountMin) }),
  ...(filters.value.amountMax.trim() && { amountTo: Number(filters.value.amountMax) }),
  ...(filters.value.startDate && { dateFrom: filters.value.startDate }),
  ...(filters.value.endDate && { dateTo: filters.value.endDate }),
}));

const { data, pending, error, refresh } = useFetch<unknown>(
  () => `/api/customers/${props.customerId}/branches`,
  { query, watch: [() => props.customerId, query] },
);

const parsed = computed(() => parseCustomerBranches(data.value, page.value, limit.value));

const gridTemplate =
  'minmax(0,1fr) minmax(0,0.75fr) minmax(0,0.95fr) minmax(0,0.75fr) minmax(0,0.75fr)';

function applyFilters(next: Partial<CustomerBranchTabFilters>) {
  filters.value = { ...filters.value, ...next };
  page.value = 1;
}

function clearAll() {
  filters.value = {
    amountMin: '',
    amountMax: '',
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
          :key="`branch-stat-${index}`"
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
            v-for="index in 2"
            :key="`branch-filter-${index}`"
            class="h-9 w-28 animate-pulse rounded-full bg-grey-55"
          />
        </div>
      </div>

      <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
        <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
          <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
            <TableCell>Branch</TableCell>
            <TableCell>Members</TableCell>
            <TableCell>Total spent</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date created</TableCell>
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
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Total branches</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">
          {{ totalBranches ?? 0 }}
        </p>
      </div>
      <div class="rounded-xl border border-grey-50 bg-white px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Total members</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">
          {{ totalEmployees ?? 0 }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <SearchField
        v-model="searchQuery"
        placeholder="Search branches"
        class="max-w-[20rem]"
      />
      <CustomerBranchFilterBar
        :filters="filters"
        @apply="applyFilters"
        @clear-all="clearAll"
      />
    </div>

    <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
      <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
        <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
          <TableCell>Branch</TableCell>
          <TableCell>Members</TableCell>
          <TableCell>Total spent</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Date created</TableCell>
        </TableHeadRow>
      </TableHeader>

      <TableBody class="!max-h-none !overflow-visible">
        <TableRow
          v-if="error && parsed.rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-5 py-10">
            <LoadErrorState
              compact
              :error="error"
              load-failed-title="Unable to load branches"
              resource-label="branch list"
              @retry="refresh()"
            />
          </TableCell>
        </TableRow>

        <TableRow
          v-else-if="parsed.rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-5 py-10 text-center text-sm text-grey-500">
            No branches found
          </TableCell>
        </TableRow>

        <template v-else>
          <TableRow
            v-for="branch in parsed.rows"
            :key="branch.id"
            :style="{ gridTemplateColumns: gridTemplate }"
          >
            <TableCell>
              <div class="flex min-w-0 items-start gap-3">
                <Avatar
                  size="md"
                  :alt="branch.name"
                  :fallback="branchInitials(branch.name)"
                  :fallback-class="branchAvatarFallbackClass(branch.statusLabel === 'Inactive')"
                />
                <div class="min-w-0 space-y-1">
                  <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <p class="truncate text-sm font-medium text-grey-900">{{ branch.name }}</p>
                    <span
                      v-if="branch.isHeadquarter"
                      class="shrink-0 rounded-[100px] px-1.5 py-1 text-[10px] font-bold uppercase text-white"
                      :style="HEADQUARTER_BADGE_STYLE"
                    >
                      Headquarter
                    </span>
                  </div>
                  <p class="truncate text-sm text-grey-500">{{ branch.address }}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">{{ branch.membersCount }}</p>
            </TableCell>
            <TableCell>
              <p class="text-sm font-medium text-grey-900">{{ branch.totalSpentLabel }}</p>
            </TableCell>
            <TableCell>
              <StatusTag
                :variant="branch.statusLabel === 'Active' ? 'success' : 'default'"
                size="medium"
              >
                {{ branch.statusLabel }}
              </StatusTag>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">{{ branch.createdAtLabel }}</p>
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
