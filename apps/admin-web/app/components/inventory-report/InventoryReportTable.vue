<script setup lang="ts">
import {
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
import CreditTableEmptyBody from '~/components/credit/CreditTableEmptyBody.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { CREDIT_LIST_PANEL_CLASS } from '~/lib/credit-table-layout';
import { INVENTORY_REPORT_TABLE_GRID } from '~/lib/inventory-report-table-layout';
import type { InventoryMovementRow } from '~/types/inventory-report';
import type { InventoryTableMeta } from '~/types/inventory';

defineProps<{
  rows: InventoryMovementRow[];
  meta: InventoryTableMeta;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
}>();

const skeletonColumns = [
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
];

const gridStyle = { gridTemplateColumns: INVENTORY_REPORT_TABLE_GRID };
</script>

<template>
  <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
    <div class="flex flex-col gap-1 border-b border-grey-50 px-6 py-5">
      <h2 class="text-xl font-medium text-header">Inventory movement</h2>
      <p class="text-sm text-neutral">
        Opening, added, sold, and closing quantities for tracked items in the selected period.
      </p>
    </div>

    <div class="flex min-h-0 flex-1 flex-col border-t border-grey-50">
      <TableHeader
        class="sticky -top-8 z-30 shrink-0 overflow-hidden border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
      >
        <TableHeadRow :style="gridStyle">
          <TableCell>Item</TableCell>
          <TableCell>Unit</TableCell>
          <TableCell>Opening quantity</TableCell>
          <TableCell>Added quantity</TableCell>
          <TableCell>Sold/deducted quantity</TableCell>
          <TableCell>Closing quantity</TableCell>
        </TableHeadRow>
      </TableHeader>

      <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
        <TableSkeleton
          :columns="skeletonColumns"
          :grid-template-columns="INVENTORY_REPORT_TABLE_GRID"
          :row-count="10"
          body-class="!max-h-none !overflow-visible"
        />
      </div>

      <CreditTableEmptyBody
        v-else-if="rows.length === 0"
        :title="emptyTitle ?? 'No inventory movement found'"
        :description="
          emptyDescription ??
          'Try another date range or search term to see movement for tracked items.'
        "
      />

      <TableBody v-else class="!max-h-none !overflow-visible pt-0">
        <TableRow
          v-for="row in rows"
          :key="row.id"
          class="even:bg-[#FAFBFC]"
          :style="gridStyle"
        >
          <TableCell class="font-medium text-header">{{ row.productName }}</TableCell>
          <TableCell>
            <StatusTag variant="default" size="medium">{{ row.unit }}</StatusTag>
          </TableCell>
          <TableCell>{{ formatDashboardNumber(row.openingQuantity) }}</TableCell>
          <TableCell>{{ formatDashboardNumber(row.addedQuantity) }}</TableCell>
          <TableCell>{{ formatDashboardNumber(row.deductedQuantity) }}</TableCell>
          <TableCell>
            <div class="flex flex-wrap items-center gap-2">
              <span>{{ formatDashboardNumber(row.closingQuantity) }}</span>
              <StatusTag v-if="row.isLowStock" variant="warning" size="medium">Low stock</StatusTag>
            </div>
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
    </div>
  </TableShell>
</template>
