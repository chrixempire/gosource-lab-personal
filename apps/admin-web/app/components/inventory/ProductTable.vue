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
import ProductActionsMenu from '~/components/inventory/ProductActionsMenu.vue';
import { PRODUCT_TABLE_GRID_TEMPLATE } from '~/lib/inventory-table-layout';
import { ORDER_LIST_PANEL_CLASS } from '~/lib/orders-table-layout';
import type { AdminProductListItem, InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  products: AdminProductListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  updatingProductId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [product: AdminProductListItem];
  viewDetails: [product: AdminProductListItem];
  markInStock: [product: AdminProductListItem];
  markOutOfStock: [product: AdminProductListItem];
  edit: [product: AdminProductListItem];
  addStock: [product: AdminProductListItem];
  removeStock: [product: AdminProductListItem];
  activate: [product: AdminProductListItem];
  deactivate: [product: AdminProductListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.products.length === 0) {
    return false;
  }
  const selectedLoaded = props.products.filter((product) => selectedSet.value.has(product.id)).length;
  if (selectedLoaded === 0) {
    return false;
  }
  if (selectedLoaded === props.products.length) {
    return true;
  }
  return 'indeterminate';
});

const skeletonColumns = [
  { kind: 'line' as const, lineClass: 'w-5' },
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'stack' as const, lineClass: 'w-20', sublineClass: 'w-16' },
  { kind: 'stack' as const, lineClass: 'w-16', sublineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'w-16' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-8' },
];

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const loadedIds = new Set(props.products.map((product) => product.id));
    selectedIds.value = selectedIds.value.filter((id) => !loadedIds.has(id));
    return;
  }

  const merged = new Set(selectedIds.value);
  for (const product of props.products) {
    merged.add(product.id);
  }
  selectedIds.value = [...merged];
}

function toggleRow(productId: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) {
    next.add(productId);
  } else {
    next.delete(productId);
  }
  selectedIds.value = [...next];
}
</script>

<template>
  <TableShell :class="[ORDER_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]">
      <TableHeadRow :style="{ gridTemplateColumns: PRODUCT_TABLE_GRID_TEMPLATE }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all items on this page"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Product</TableCell>
        <TableCell>Category</TableCell>
        <TableCell>Price</TableCell>
        <TableCell>Quantity</TableCell>
        <TableCell>Unit</TableCell>
        <TableCell>Status</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
      <TableSkeleton
        :columns="skeletonColumns"
        :grid-template-columns="PRODUCT_TABLE_GRID_TEMPLATE"
        :row-count="10"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="product in products"
        :key="product.id"
        class="cursor-pointer transition-colors hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: PRODUCT_TABLE_GRID_TEMPLATE }"
        @click="emit('rowClick', product)"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(product.id)"
            :aria-label="`Select ${product.name}`"
            @update:model-value="toggleRow(product.id, $event)"
          />
        </TableCell>

        <TableCell>
          <div class="flex min-w-0 items-center gap-3">
            <div
              v-if="product.imageUrl"
              class="size-11 shrink-0 overflow-hidden rounded-lg border border-grey-50 bg-grey-55"
            >
              <img :src="product.imageUrl" :alt="product.name" class="size-full object-cover">
            </div>
            <div
              v-else
              class="flex size-11 shrink-0 items-center justify-center rounded-lg border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-300"
            >
              {{ product.name.charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-grey-900">{{ product.name }}</p>
              <p class="mt-0.5 truncate text-sm text-grey-300">{{ product.description }}</p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <p class="truncate text-sm text-grey-800">{{ product.categoryLabel }}</p>
        </TableCell>

        <TableCell>
          <div class="flex flex-col gap-0.5">
            <p class="text-sm font-semibold text-grey-900">{{ product.priceLabel }}</p>
            <p
              v-if="product.compareAtPriceLabel"
              class="text-sm text-grey-300 line-through"
            >
              {{ product.compareAtPriceLabel }}
            </p>
          </div>
        </TableCell>

        <TableCell>
          <div class="flex flex-wrap items-center gap-1.5">
            <p class="text-sm font-semibold text-grey-900">{{ product.quantityLabel }}</p>
            <span
              v-if="product.purchaseUnitLabel && product.purchaseUnitLabel !== '—'"
              class="inline-flex w-fit rounded-full border border-grey-50 bg-grey-55 px-2.5 py-0.5 text-xs font-medium text-grey-700"
            >
              {{ product.purchaseUnitLabel }}
            </span>
            <StatusTag
              v-if="product.stockAlert?.variant === 'negative'"
              variant="negative"
            >
              {{ product.stockAlert.label }}
            </StatusTag>
            <StatusTag
              v-else-if="product.stockAlert?.variant === 'warning'"
              variant="warning"
            >
              {{ product.stockAlert.label }}
            </StatusTag>
          </div>
        </TableCell>

        <TableCell>
          <span
            class="inline-flex w-fit rounded-full border border-grey-50 bg-grey-55 px-2.5 py-0.5 text-xs font-medium text-grey-700"
          >
            {{ product.unitCountLabel }}
          </span>
        </TableCell>

        <TableCell @click.stop>
          <StatusTag :variant="product.statusVariant" size="medium">
            {{ product.statusLabel }}
          </StatusTag>
        </TableCell>

        <TableCell class="flex items-center justify-end">
          <ProductActionsMenu
            :product="product"
            :disabled="updatingProductId === product.id"
            @view-details="emit('viewDetails', product)"
            @mark-in-stock="emit('markInStock', product)"
            @mark-out-of-stock="emit('markOutOfStock', product)"
            @edit="emit('edit', product)"
            @add-stock="emit('addStock', product)"
            @remove-stock="emit('removeStock', product)"
            @activate="emit('activate', product)"
            @deactivate="emit('deactivate', product)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="meta.total > 0">
      <PaginationBar
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        inherit-radius
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
