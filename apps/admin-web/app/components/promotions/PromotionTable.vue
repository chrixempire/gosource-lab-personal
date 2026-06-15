<script setup lang="ts">
import {
  Checkbox,
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
import PromotionActionsMenu from '~/components/promotions/PromotionActionsMenu.vue';
import { promotionStatusVariant } from '~/lib/promotion-constants';
import {
  PROMOTION_LIST_PANEL_CLASS,
  PROMOTION_TABLE_GRID_TEMPLATE,
} from '~/lib/promotions-table-layout';
import type { AdminPromotionListItem } from '~/types/promotions';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  promotions: AdminPromotionListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyPromotionId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  edit: [promotion: AdminPromotionListItem];
  duplicate: [promotion: AdminPromotionListItem];
  activate: [promotion: AdminPromotionListItem];
  deactivate: [promotion: AdminPromotionListItem];
  delete: [promotion: AdminPromotionListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.promotions.length === 0) return false;
  const n = props.promotions.filter((row) => selectedSet.value.has(row.id)).length;
  if (n === 0) return false;
  if (n === props.promotions.length) return true;
  return 'indeterminate';
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const ids = new Set(props.promotions.map((row) => row.id));
    selectedIds.value = selectedIds.value.filter((id) => !ids.has(id));
    return;
  }
  const merged = new Set(selectedIds.value);
  props.promotions.forEach((row) => merged.add(row.id));
  selectedIds.value = [...merged];
}

function toggleRow(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}

function usageLabel(count: number) {
  return `${count} ${count === 1 ? 'order' : 'orders'}`;
}

function itemsLabel(count: number) {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}
</script>

<template>
  <TableShell :class="[PROMOTION_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: PROMOTION_TABLE_GRID_TEMPLATE }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all promotions"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Title</TableCell>
        <TableCell>Usage</TableCell>
        <TableCell>Items</TableCell>
        <TableCell>Status</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1">
      <TableSkeleton
        :columns="[
          { kind: 'line', lineClass: 'w-5' },
          { kind: 'stack', lineClass: 'w-full', sublineClass: 'w-2/3' },
          { kind: 'line', lineClass: 'w-16' },
          { kind: 'line', lineClass: 'w-12' },
          { kind: 'line', lineClass: 'h-7 w-24 rounded-full' },
          { kind: 'line', lineClass: 'w-8' },
        ]"
        :grid-template-columns="PROMOTION_TABLE_GRID_TEMPLATE"
        :row-count="10"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="promotion in promotions"
        :key="promotion.id"
        class="bg-white"
        :style="{ gridTemplateColumns: PROMOTION_TABLE_GRID_TEMPLATE }"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(promotion.id)"
            @update:model-value="toggleRow(promotion.id, $event)"
          />
        </TableCell>
        <TableCell>
          <p class="text-sm font-semibold text-grey-900">{{ promotion.name }}</p>
          <p class="mt-0.5 line-clamp-2 text-xs text-grey-500">{{ promotion.description }}</p>
          <p v-if="promotion.discountLabel !== '—'" class="mt-1 text-xs text-primary-600">
            {{ promotion.discountLabel }}
          </p>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-700">{{ usageLabel(promotion.usageCount) }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-700">{{ itemsLabel(promotion.itemsCount) }}</p>
        </TableCell>
        <TableCell>
          <StatusTag :variant="promotionStatusVariant(promotion.status)" size="medium">
            {{ promotion.statusLabel }}
          </StatusTag>
        </TableCell>
        <TableCell @click.stop>
          <PromotionActionsMenu
            :promotion="promotion"
            :disabled="busyPromotionId === promotion.id"
            @edit="emit('edit', promotion)"
            @duplicate="emit('duplicate', promotion)"
            @activate="emit('activate', promotion)"
            @deactivate="emit('deactivate', promotion)"
            @delete="emit('delete', promotion)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && promotions.length > 0">
      <PaginationBar
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
