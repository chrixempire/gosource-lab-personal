<script setup lang="ts">
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import AdminTableRowIndex from '~/components/shared/AdminTableRowIndex.vue';
import type { AdminOrderLineItem } from '~/lib/order-details';

defineProps<{
  items: AdminOrderLineItem[];
  loading?: boolean;
}>();

const gridTemplate = '3.5rem minmax(0,1.5fr) minmax(0,0.5fr) minmax(0,0.65fr) minmax(0,0.75fr)';
</script>

<template>
  <TableShell class="overflow-visible rounded-[20px] border border-grey-50 bg-white">
    <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-[20px] border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
      <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
        <TableCell>S/N</TableCell>
        <TableCell>Product</TableCell>
        <TableCell>Qty</TableCell>
        <TableCell>Unit</TableCell>
        <TableCell class="text-right">Total</TableCell>
      </TableHeadRow>
    </TableHeader>
    <TableSkeleton
      v-if="loading"
      :columns="[
        { kind: 'line', lineClass: 'w-5' },
        { kind: 'line', lineClass: 'w-full' },
        { kind: 'line', lineClass: 'w-10' },
        { kind: 'line', lineClass: 'w-12' },
        { kind: 'line', lineClass: 'w-20' },
      ]"
      :grid-template-columns="gridTemplate"
      :row-count="10"
      row-class="min-h-16 bg-white py-2.5 last:border-b-0"
    />
    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="(item, index) in items"
        :key="item.id"
        class="last:border-b-0"
        :style="{ gridTemplateColumns: gridTemplate }"
      >
        <TableCell>
          <AdminTableRowIndex :value="index + 1" />
        </TableCell>
        <TableCell class="font-medium text-grey-900">{{ item.name }}</TableCell>
        <TableCell class="text-grey-700">{{ item.quantity }}</TableCell>
        <TableCell class="text-grey-700">{{ item.unit }}</TableCell>
        <TableCell class="text-right font-semibold text-grey-900">{{ item.lineTotalLabel }}</TableCell>
      </TableRow>
    </TableBody>
    <TableFooter v-if="!loading && items.length === 0">
      <p class="px-4 py-6 text-center text-sm text-grey-300">No line items.</p>
    </TableFooter>
  </TableShell>
</template>
