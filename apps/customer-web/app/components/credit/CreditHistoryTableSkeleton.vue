<script setup lang="ts">
import {
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import {
  CREDIT_REPAYMENT_HISTORY_SKELETON_COLUMNS,
  CREDIT_REPAYMENT_TABLE_GRID,
  CREDIT_REQUEST_HISTORY_SKELETON_COLUMNS,
  CREDIT_REQUEST_TABLE_GRID_TEMPLATE,
} from '~/lib/credit-history-table-layout';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/customer-table-layout';

const props = withDefaults(
  defineProps<{
    variant?: 'credit' | 'repayment';
    rowCount?: number;
    showFooter?: boolean;
  }>(),
  {
    variant: 'credit',
    rowCount: 8,
    showFooter: true,
  },
);

const gridTemplate = computed(() =>
  props.variant === 'credit' ? CREDIT_REQUEST_TABLE_GRID_TEMPLATE : CREDIT_REPAYMENT_TABLE_GRID,
);

const skeletonColumns = computed(() =>
  props.variant === 'credit'
    ? CREDIT_REQUEST_HISTORY_SKELETON_COLUMNS
    : CREDIT_REPAYMENT_HISTORY_SKELETON_COLUMNS,
);

const showActionsColumn = computed(() => props.variant === 'credit');
</script>

<template>
  <TableShell :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
    <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
      <TableHeadRow
        :style="{ gridTemplateColumns: gridTemplate }"
        class="pointer-events-none opacity-60"
      >
        <TableCell>Reference</TableCell>
        <TableCell>Amount</TableCell>
        <TableCell>Request type</TableCell>
        <TableCell>Date</TableCell>
        <TableCell>Status</TableCell>
        <TableCell v-if="showActionsColumn" class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      :columns="skeletonColumns"
      :grid-template-columns="gridTemplate"
      :row-count="rowCount"
      :body-class="CUSTOMER_TABLE_BODY_CLASS"
    />

    <TableFooter v-if="showFooter">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="h-4 w-20 animate-pulse rounded-md bg-grey-55" />
          <div class="h-4 w-28 animate-pulse rounded-md bg-grey-55" />
        </div>
        <div class="flex items-center gap-2">
          <div class="size-8 animate-pulse rounded-md border border-grey-50 bg-grey-55" />
          <div class="size-8 animate-pulse rounded-md bg-grey-55" />
          <div class="size-8 animate-pulse rounded-md border border-grey-50 bg-grey-55" />
        </div>
      </div>
    </TableFooter>
  </TableShell>
</template>
