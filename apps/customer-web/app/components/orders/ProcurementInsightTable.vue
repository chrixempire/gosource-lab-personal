<script setup lang="ts">
import {
  PaginationBar,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeadRow,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { formatNaira } from '~/composables/useMarketplaceCart';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
  CUSTOMER_TABLE_STRIPED_ROW_CLASS,
} from '~/lib/customer-table-layout';
import type { ProcurementInsightTableRow } from '~/lib/procurement-insight-table';
import {
  PROCUREMENT_INSIGHT_TABLE_GRID_TEMPLATE,
  PROCUREMENT_INSIGHT_TABLE_SKELETON_COLUMNS,
} from '~/lib/orders-insight-table-layout';

const props = withDefaults(
  defineProps<{
    rows: ProcurementInsightTableRow[];
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    loading?: boolean;
    periodLabel?: string;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    periodLabel: 'This month',
    emptyTitle: 'No procurement data',
    emptyDescription:
      'Products you order will appear here once orders are placed in the selected period.',
  },
);

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
}>();

const skeletonRowCount = computed(() => Math.max(1, Math.min(props.pageSize, 15)));
</script>

<template>
  <TableShell :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
    <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
      <TableHeadRow
        :style="{ gridTemplateColumns: PROCUREMENT_INSIGHT_TABLE_GRID_TEMPLATE }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell>Product</TableCell>
        <TableCell>Qty</TableCell>
        <TableCell>Spend</TableCell>
        <TableCell>Breakdown</TableCell>
        <TableCell>Purchased</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="PROCUREMENT_INSIGHT_TABLE_SKELETON_COLUMNS"
      :grid-template-columns="PROCUREMENT_INSIGHT_TABLE_GRID_TEMPLATE"
      :row-count="skeletonRowCount"
      :body-class="CUSTOMER_TABLE_BODY_CLASS"
    />

    <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
      <TableRow
        v-for="row in rows"
        :key="row.id"
        :style="{ gridTemplateColumns: PROCUREMENT_INSIGHT_TABLE_GRID_TEMPLATE }"
        :class="CUSTOMER_TABLE_STRIPED_ROW_CLASS"
      >
        <TableCell>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-grey-900">
              {{ row.name }}
            </p>
            <p class="mt-0.5 truncate text-xs text-grey-300">
              {{ row.description }}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <span class="text-sm tabular-nums text-grey-900">{{ row.quantity }}</span>
        </TableCell>
        <TableCell>
          <span class="text-sm font-medium tabular-nums text-grey-900">
            {{ formatNaira(row.totalSpent) }}
          </span>
        </TableCell>
        <TableCell>
          <div class="flex min-w-0 flex-col gap-1.5">
            <span class="text-sm tabular-nums font-medium text-grey-900">
              {{ row.percent }}%
            </span>
            <div class="h-2 w-full overflow-hidden rounded-full bg-grey-55">
              <div
                class="h-full rounded-full transition-[width] duration-300"
                :class="row.barClass"
                :style="{ width: `${Math.max(row.percent, 4)}%` }"
              />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span class="text-sm text-grey-900">{{ row.lastPurchaseLabel }}</span>
        </TableCell>
      </TableRow>

      <div
        v-if="rows.length === 0"
        class="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">
          {{ emptyTitle }}
        </p>
        <p class="mt-2 text-sm text-grey-300">
          {{ emptyDescription }}
        </p>
        <p v-if="periodLabel" class="mt-1 text-xs text-grey-300">
          Period: {{ periodLabel }}
        </p>
      </div>
    </TableBody>

    <TableFooter v-if="!loading && totalItems > 0">
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
