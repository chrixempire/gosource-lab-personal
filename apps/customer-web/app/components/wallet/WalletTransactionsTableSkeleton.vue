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
  WALLET_TRANSACTIONS_SKELETON_COLUMNS,
  WALLET_TRANSACTIONS_TABLE_GRID,
} from '~/lib/wallet-transactions-table-layout';

withDefaults(
  defineProps<{
    rowCount?: number;
    showFooter?: boolean;
  }>(),
  {
    rowCount: 8,
    showFooter: true,
  },
);
</script>

<template>
  <TableShell class="flex w-full flex-col">
    <TableHeader>
      <TableHeadRow
        :style="{ gridTemplateColumns: WALLET_TRANSACTIONS_TABLE_GRID }"
        class="pointer-events-none opacity-60"
      >
        <TableCell class="flex items-center justify-center">
          <div class="size-4 animate-pulse rounded-[5px] bg-grey-50" />
        </TableCell>
        <TableCell>Title</TableCell>
        <TableCell>Amount</TableCell>
        <TableCell>Reference</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Date</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      :columns="WALLET_TRANSACTIONS_SKELETON_COLUMNS"
      :grid-template-columns="WALLET_TRANSACTIONS_TABLE_GRID"
      :row-count="rowCount"
    />

    <TableFooter v-if="showFooter">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="h-4 w-24 animate-pulse rounded-md bg-grey-55" />
        <div class="flex items-center gap-2">
          <div class="h-9 w-24 animate-pulse rounded-[10px] bg-grey-55" />
          <div class="h-9 w-20 animate-pulse rounded-[10px] bg-grey-55" />
        </div>
      </div>
    </TableFooter>
  </TableShell>
</template>
