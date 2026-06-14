<script setup lang="ts">
import {
  PaginationBar,
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
import StoreCountQuantityInput from '~/components/store-count/StoreCountQuantityInput.vue';
import StoreCountStatusTag from '~/components/store-count/StoreCountStatusTag.vue';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { ORDER_LIST_PANEL_CLASS } from '~/lib/orders-table-layout';
import { STORE_COUNT_TABLE_GRID_TEMPLATE } from '~/lib/store-count-table-layout';
import type { InventoryTableMeta } from '~/types/inventory';
import type { StoreCountProductRow } from '~/types/store-count';

defineProps<{
  rows: StoreCountProductRow[];
  meta: InventoryTableMeta;
  loading?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  'update:countedQuantity': [productId: string, quantity: number];
}>();

const skeletonColumns = [
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'w-20' },
];

const gridStyle = { gridTemplateColumns: STORE_COUNT_TABLE_GRID_TEMPLATE };

function onCountedQuantityChange(productId: string, quantity: number) {
  emit('update:countedQuantity', productId, quantity);
}
</script>

<template>
  <TableShell :class="[ORDER_LIST_PANEL_CLASS, 'overflow-x-auto']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="gridStyle">
        <TableCell>Item</TableCell>
        <TableCell>Quantity left</TableCell>
        <TableCell>Counted quantity</TableCell>
        <TableCell>Status</TableCell>
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
      <TableSkeleton
        :columns="skeletonColumns"
        :grid-template-columns="STORE_COUNT_TABLE_GRID_TEMPLATE"
        :row-count="10"
        body-class="!max-h-none !overflow-visible"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="row in rows"
        :key="row.id"
        class="even:bg-[#FAFBFC]"
        :style="gridStyle"
      >
        <TableCell>
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="size-11 shrink-0 overflow-hidden rounded-lg border border-grey-50 bg-grey-55"
            >
              <img
                v-if="row.imageUrl"
                :src="row.imageUrl"
                :alt="row.name"
                class="size-full object-cover"
              >
              <div
                v-else
                class="flex size-full items-center justify-center text-sm font-semibold text-grey-300"
              >
                {{ row.name.charAt(0) }}
              </div>
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-grey-900">{{ row.name }}</p>
              <p class="mt-0.5 text-sm text-grey-500">{{ formatDashboardCurrency(row.marketPrice) }}</p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div class="flex items-center gap-2">
            <span class="text-sm text-grey-800">{{ row.quantityLeft }}</span>
            <StatusTag variant="default" size="medium">{{ row.unit || 'unit' }}</StatusTag>
          </div>
        </TableCell>

        <TableCell>
          <StoreCountQuantityInput
            :model-value="row.countedQuantity"
            :readonly="readonly"
            @update:model-value="onCountedQuantityChange(row.id, $event)"
          />
        </TableCell>

        <TableCell>
          <StoreCountStatusTag :status="row.status" />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && meta.total > 0">
      <PaginationBar
        :page="meta.page"
        :page-size="meta.limit"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        :disabled="readonly"
        inherit-radius
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
