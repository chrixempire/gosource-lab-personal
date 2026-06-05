<script setup lang="ts">
import {
  Avatar,
  SearchField,
  TableBody,
  TableCell,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_ANALYTICS_TABLE_GRID, CREDIT_LIST_PANEL_CLASS } from '~/lib/credit-table-layout';
import { CREDIT_LIST_SEARCH_CLASS } from '~/lib/credit-page-layout';
import type { CreditTopPerformerRow } from '~/types/credit';

const props = defineProps<{
  rows: CreditTopPerformerRow[];
  loading?: boolean;
}>();

const searchQuery = ref('');

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.rows;
  return props.rows.filter((row) => row.displayName.toLowerCase().includes(query));
});

function performerInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || '?'
  );
}

function avatarFallbackClass(isInactive: boolean) {
  return isInactive
    ? '!bg-grey-55 !text-grey-400'
    : '!bg-primary-50 !text-primary-700';
}
</script>

<template>
  <section class="min-w-0">
    <h4 class="text-xl font-semibold tracking-[-0.3px] text-grey-900">Top credit performers</h4>
    <p class="mt-1 text-sm text-grey-500">These are your top performing credit users.</p>

    <SearchField
      v-model="searchQuery"
      placeholder="Search users"
      :class="[CREDIT_LIST_SEARCH_CLASS, 'mt-4 max-w-[295px]']"
      :disabled="loading && rows.length === 0"
    />

    <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'mt-4 overflow-visible']">
      <TableHeader
        class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
      >
        <TableHeadRow :style="{ gridTemplateColumns: CREDIT_ANALYTICS_TABLE_GRID }">
          <TableCell>Business name</TableCell>
          <TableCell>Credit limit</TableCell>
          <TableCell>Credit used</TableCell>
          <TableCell>Repayment score</TableCell>
        </TableHeadRow>
      </TableHeader>

      <div v-if="loading" class="p-4">
        <TableSkeleton
          :columns="Array(4).fill({ kind: 'line' as const, lineClass: 'w-full' })"
          :grid-template-columns="CREDIT_ANALYTICS_TABLE_GRID"
          :row-count="6"
        />
      </div>

      <TableBody v-else-if="filteredRows.length" class="!max-h-none !overflow-visible">
        <TableRow
          v-for="row in filteredRows"
          :key="row.businessId"
          class="even:bg-[#FAFBFC]"
          :style="{ gridTemplateColumns: CREDIT_ANALYTICS_TABLE_GRID }"
        >
          <TableCell>
            <div class="flex min-w-0 items-center gap-2">
              <Avatar
                size="md"
                :alt="row.displayName"
                :fallback="performerInitials(row.displayName)"
                :class="row.accountType === 'individual' ? 'rounded-full' : 'rounded-lg'"
                :fallback-class="avatarFallbackClass(row.status === 'inactive')"
              />
              <p class="truncate text-sm font-medium text-grey-900">{{ row.displayName }}</p>
            </div>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium text-grey-800">
              {{ formatCreditFromKobo(row.creditLimitKobo) }}
            </p>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium text-grey-800">
              {{ formatCreditFromKobo(row.creditUsedKobo) }}
            </p>
          </TableCell>
          <TableCell>
            <p class="text-sm font-medium text-grey-800">{{ row.repaymentScore }}</p>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableBody v-else class="!max-h-none !overflow-visible">
        <TableRow :style="{ gridTemplateColumns: CREDIT_ANALYTICS_TABLE_GRID }">
          <TableCell class="col-span-4 py-10 text-center text-sm text-grey-500">
            No performers match your search.
          </TableCell>
        </TableRow>
      </TableBody>
    </TableShell>
  </section>
</template>
