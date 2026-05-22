<script setup lang="ts">
import {
  SearchField,
  TableBody,
  TableCell,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import CustomerCreditHistoryFilterBar, {
  type CustomerCreditHistoryFilters,
} from '~/components/customers/CustomerCreditHistoryFilterBar.vue';

const searchQuery = ref('');
const pending = ref(false);
const filters = ref<CustomerCreditHistoryFilters>({
  amountMin: '',
  amountMax: '',
  status: [],
  startDate: '',
  endDate: '',
});

const gridTemplate =
  'minmax(0,0.9fr) minmax(0,0.85fr) minmax(0,0.85fr) minmax(0,0.85fr) minmax(0,0.8fr)';

function applyFilters(next: Partial<CustomerCreditHistoryFilters>) {
  filters.value = { ...filters.value, ...next };
}

function clearAll() {
  filters.value = {
    amountMin: '',
    amountMax: '',
    status: [],
    startDate: '',
    endDate: '',
  };
}
</script>

<template>
  <div class="space-y-5">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="title in ['Total credit collected', 'Total repaid', 'Active credit']"
        :key="title"
        class="rounded-xl border border-grey-50 bg-white px-4 py-4"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">{{ title }}</p>
        <p class="mt-2 text-[1.75rem] font-semibold leading-10 text-grey-900">0</p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <SearchField
        v-model="searchQuery"
        placeholder="Search credit history"
        class="max-w-[20rem]"
      />
      <CustomerCreditHistoryFilterBar
        :filters="filters"
        @apply="applyFilters"
        @clear-all="clearAll"
      />
    </div>

    <TableShell class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white">
      <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
        <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
          <TableCell>Request</TableCell>
          <TableCell>Request type</TableCell>
          <TableCell>Requested amount</TableCell>
          <TableCell>Repaid amount</TableCell>
          <TableCell>Status</TableCell>
        </TableHeadRow>
      </TableHeader>

      <div v-if="pending" class="p-4">
        <TableSkeleton
          :columns="Array(5).fill({ kind: 'line' as const, lineClass: 'w-full' })"
          :grid-template-columns="gridTemplate"
          :row-count="10"
        />
      </div>

      <TableBody v-else class="!max-h-none !overflow-visible">
        <TableRow :style="{ gridTemplateColumns: gridTemplate }">
          <TableCell class="col-span-5 py-10 text-center text-sm text-grey-500">
            No credit history available yet
          </TableCell>
        </TableRow>
      </TableBody>
    </TableShell>
  </div>
</template>
