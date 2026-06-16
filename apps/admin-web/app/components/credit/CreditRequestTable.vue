<script setup lang="ts">
import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import CreditTableEmptyBody from '~/components/credit/CreditTableEmptyBody.vue';
import { creditStatusVariant } from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_LIST_PANEL_CLASS, CREDIT_REQUEST_TABLE_GRID } from '~/lib/credit-table-layout';
import type { AdminCreditRequestListItem } from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  rows: AdminCreditRequestListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  view: [row: AdminCreditRequestListItem];
  viewCreditHistory: [row: AdminCreditRequestListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.rows.length === 0) return false;
  const n = props.rows.filter((row) => selectedSet.value.has(row.id)).length;
  if (n === 0) return false;
  if (n === props.rows.length) return true;
  return 'indeterminate';
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const ids = new Set(props.rows.map((row) => row.id));
    selectedIds.value = selectedIds.value.filter((id) => !ids.has(id));
    return;
  }
  const merged = new Set(selectedIds.value);
  props.rows.forEach((row) => merged.add(row.id));
  selectedIds.value = [...merged];
}

function toggleRow(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}
</script>

<template>
  <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: CREDIT_REQUEST_TABLE_GRID }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all credit requests"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Request</TableCell>
        <TableCell>Business name</TableCell>
        <TableCell>Request type</TableCell>
        <TableCell>Requested amount</TableCell>
        <TableCell>Credit limit</TableCell>
        <TableCell>Status</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="p-4">
      <TableSkeleton
        :columns="Array(8).fill({ kind: 'line' as const, lineClass: 'w-full' })"
        :grid-template-columns="CREDIT_REQUEST_TABLE_GRID"
        :row-count="10"
      />
    </div>

    <CreditTableEmptyBody
      v-else-if="rows.length === 0"
      :title="emptyTitle ?? 'No credit requests found'"
      :description="emptyDescription"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="row in rows"
        :key="row.id"
        class="cursor-pointer transition-colors hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: CREDIT_REQUEST_TABLE_GRID }"
        @click="emit('view', row)"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(row.id)"
            @update:model-value="toggleRow(row.id, $event)"
          />
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-900">#{{ row.reference }}</p>
          <p class="mt-1 text-xs text-grey-500">{{ row.createdAtLabel }}</p>
        </TableCell>
        <TableCell>
          <p class="truncate text-sm font-medium text-grey-900">{{ row.displayName }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">{{ row.requestTypeLabel }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">
            {{ formatCreditFromKobo(row.requestedAmountKobo) }}
          </p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">
            {{ formatCreditFromKobo(row.creditLimitKobo) }}
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
              <CreditTableActionsTrigger aria-label="Credit request actions" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="emit('view', row)">View details</DropdownMenuItem>
              <DropdownMenuItem @select="emit('viewCreditHistory', row)">
                View credit history
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && meta.total > 0">
      <CreditTablePagination
        :meta="meta"
        @page="emit('page', $event)"
        @page-size="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
