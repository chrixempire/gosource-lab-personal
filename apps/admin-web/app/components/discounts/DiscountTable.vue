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
import { Check, Copy } from 'lucide-vue-next';
import DiscountActionsMenu from '~/components/discounts/DiscountActionsMenu.vue';
import CreditTableEmptyBody from '~/components/credit/CreditTableEmptyBody.vue';
import { discountStatusVariant } from '~/lib/discount-constants';
import {
  DISCOUNT_LIST_PANEL_CLASS,
  DISCOUNT_TABLE_GRID_TEMPLATE,
} from '~/lib/discounts-table-layout';
import type { AdminDiscountListItem } from '~/types/discounts';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  discounts: AdminDiscountListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyDiscountId?: string | null;
  copiedDiscountId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  copy: [discount: AdminDiscountListItem];
  edit: [discount: AdminDiscountListItem];
  activate: [discount: AdminDiscountListItem];
  deactivate: [discount: AdminDiscountListItem];
  delete: [discount: AdminDiscountListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.discounts.length === 0) return false;
  const n = props.discounts.filter((d) => selectedSet.value.has(d.id)).length;
  if (n === 0) return false;
  if (n === props.discounts.length) return true;
  return 'indeterminate';
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const ids = new Set(props.discounts.map((d) => d.id));
    selectedIds.value = selectedIds.value.filter((id) => !ids.has(id));
    return;
  }
  const merged = new Set(selectedIds.value);
  props.discounts.forEach((d) => merged.add(d.id));
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
  <TableShell :class="[DISCOUNT_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: DISCOUNT_TABLE_GRID_TEMPLATE }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all discounts"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Title</TableCell>
        <TableCell>Discount type</TableCell>
        <TableCell>Usage</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Expiration</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1">
      <TableSkeleton
        :columns="[
          { kind: 'line', lineClass: 'w-5' },
          { kind: 'stack', lineClass: 'w-full', sublineClass: 'w-2/3' },
          { kind: 'line', lineClass: 'w-24' },
          { kind: 'line', lineClass: 'w-full' },
          { kind: 'line', lineClass: 'h-7 w-24 rounded-full' },
          { kind: 'line', lineClass: 'w-20' },
          { kind: 'line', lineClass: 'w-8' },
        ]"
        :grid-template-columns="DISCOUNT_TABLE_GRID_TEMPLATE"
        :row-count="10"
      />
    </div>

    <CreditTableEmptyBody
      v-else-if="discounts.length === 0"
      title="No discounts found"
      description="Create a discount or adjust your filters."
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="discount in discounts"
        :key="discount.id"
        :style="{ gridTemplateColumns: DISCOUNT_TABLE_GRID_TEMPLATE }"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(discount.id)"
            @update:model-value="toggleRow(discount.id, $event)"
          />
        </TableCell>
        <TableCell>
          <div class="flex items-start gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-grey-900">{{ discount.code }}</p>
              <p class="mt-0.5 text-xs text-grey-500">{{ discount.description }}</p>
            </div>
            <button
              type="button"
              class="shrink-0 cursor-pointer text-grey-400 transition-colors hover:text-primary-600"
              aria-label="Copy code"
              @click.stop="emit('copy', discount)"
            >
              <Check
                v-if="copiedDiscountId === discount.id"
                class="size-4 text-primary-500"
              />
              <Copy v-else class="size-4" />
            </button>
          </div>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-800">{{ discount.categoryLabel }}</p>
        </TableCell>
        <TableCell>
          <div class="space-y-1.5">
            <div class="h-2 overflow-hidden rounded-full bg-grey-55">
              <div
                class="h-full rounded-full bg-primary-500"
                :style="{ width: `${discount.usagePercent}%` }"
              />
            </div>
            <p class="text-xs text-grey-500">
              {{ discount.usageCount }} of {{ discount.usageLimit > 0 ? discount.usageLimit : '∞' }}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <StatusTag :variant="discountStatusVariant(discount.status)" size="medium">
            {{ discount.statusLabel }}
          </StatusTag>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-700">{{ discount.expiryDateLabel }}</p>
        </TableCell>
        <TableCell @click.stop>
          <DiscountActionsMenu
            :discount="discount"
            :disabled="busyDiscountId === discount.id"
            @copy="emit('copy', discount)"
            @edit="emit('edit', discount)"
            @activate="emit('activate', discount)"
            @deactivate="emit('deactivate', discount)"
            @delete="emit('delete', discount)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && discounts.length > 0">
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
