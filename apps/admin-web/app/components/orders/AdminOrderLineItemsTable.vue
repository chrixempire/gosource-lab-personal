<script setup lang="ts">
import {
  Checkbox,
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
import AdminOrderLineItemsMobileList from '~/components/orders/AdminOrderLineItemsMobileList.vue';
import AdminTableRowIndex from '~/components/shared/AdminTableRowIndex.vue';
import { useAdminCompactViewport } from '~/composables/useAdminCompactViewport';
import type { AdminOrderLineItem } from '~/lib/order-details';

const props = defineProps<{
  items: AdminOrderLineItem[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
}>();

const emit = defineEmits<{
  toggleSelect: [itemId: string, selected: boolean];
}>();

const gridTemplate = computed(() =>
  props.selectable
    ? '2.75rem 3.5rem minmax(0,1.5fr) minmax(0,0.5fr) minmax(0,0.65fr) minmax(0,5.5rem) minmax(0,0.75fr)'
    : '3.5rem minmax(0,1.5fr) minmax(0,0.5fr) minmax(0,0.65fr) minmax(0,5.5rem) minmax(0,0.75fr)',
);

const skeletonColumns = computed(() => {
  const columns = [
    { kind: 'line' as const, lineClass: 'w-5' },
    { kind: 'line' as const, lineClass: 'w-full' },
    { kind: 'line' as const, lineClass: 'w-10' },
    { kind: 'line' as const, lineClass: 'w-12' },
    { kind: 'line' as const, lineClass: 'w-16' },
    { kind: 'line' as const, lineClass: 'w-20' },
  ];

  if (props.selectable) {
    return [{ kind: 'line' as const, lineClass: 'w-4' }, ...columns];
  }

  return columns;
});

const isCompactViewport = useAdminCompactViewport();

function isSelected(itemId: string) {
  return props.selectedIds?.includes(itemId) ?? false;
}
</script>

<template>
  <AdminOrderLineItemsMobileList
    v-if="isCompactViewport"
    :items="items"
    :loading="loading"
    :selectable="selectable"
    :selected-ids="selectedIds"
    @toggle-select="(itemId, selected) => emit('toggleSelect', itemId, selected)"
  />

  <TableShell v-else class="overflow-visible rounded-[20px] border border-grey-50 bg-white">
    <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-[20px] border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
      <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
        <TableCell v-if="selectable" />
        <TableCell>S/N</TableCell>
        <TableCell>Product</TableCell>
        <TableCell>Qty</TableCell>
        <TableCell>Unit</TableCell>
        <TableCell>Status</TableCell>
        <TableCell class="text-right">Total</TableCell>
      </TableHeadRow>
    </TableHeader>
    <TableSkeleton
      v-if="loading"
      :columns="skeletonColumns"
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
        <TableCell v-if="selectable">
          <Checkbox
            :model-value="isSelected(item.id)"
            :disabled="item.isDelivered"
            @update:model-value="emit('toggleSelect', item.id, Boolean($event))"
          />
        </TableCell>
        <TableCell>
          <AdminTableRowIndex :value="index + 1" />
        </TableCell>
        <TableCell class="font-medium text-grey-900">{{ item.name }}</TableCell>
        <TableCell class="text-grey-700">{{ item.quantity }}</TableCell>
        <TableCell class="text-grey-700">{{ item.unit }}</TableCell>
        <TableCell>
          <StatusTag
            :variant="item.statusVariant"
            size="small"
            class="rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold normal-case"
          >
            {{ item.statusLabel }}
          </StatusTag>
        </TableCell>
        <TableCell class="text-right font-semibold text-grey-900">{{ item.lineTotalLabel }}</TableCell>
      </TableRow>
    </TableBody>
    <TableFooter v-if="!loading && items.length === 0">
      <p class="px-4 py-6 text-center text-sm text-grey-300">No line items.</p>
    </TableFooter>
  </TableShell>
</template>
