<script setup lang="ts">
import {
  Checkbox,
  PaginationBar,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { GripVertical } from 'lucide-vue-next';
import draggable from 'vuedraggable';
import CategoryActionsMenu from '~/components/inventory/CategoryActionsMenu.vue';
import { ORDER_LIST_PANEL_CLASS } from '~/lib/orders-table-layout';
import type { AdminCategoryListItem, InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  categories: AdminCategoryListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  rearrangeMode?: boolean;
  actionsDisabled?: boolean;
  busyCategoryId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  view: [category: AdminCategoryListItem];
  edit: [category: AdminCategoryListItem];
  delete: [category: AdminCategoryListItem];
  'update:categories': [categories: AdminCategoryListItem[]];
}>();

/** Keep category + description visually closer, while reserving breathing room for count and actions. */
const tableGridTemplate = computed(() =>
  props.rearrangeMode
    ? '2.5rem minmax(14rem,0.95fr) minmax(12rem,0.75fr) 5.5rem'
    : '2.75rem minmax(14rem,0.95fr) minmax(12rem,0.75fr) 5.5rem 4.5rem',
);

const skeletonColumns = computed(() => {
  const base = [
    { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
    { kind: 'line' as const, lineClass: 'w-full' },
    { kind: 'line' as const, lineClass: 'w-16' },
  ];
  if (props.rearrangeMode) {
    return [{ kind: 'line' as const, lineClass: 'w-6' }, ...base];
  }
  return [
    { kind: 'line' as const, lineClass: 'w-5' },
    ...base,
    { kind: 'line' as const, lineClass: 'w-8' },
  ];
});

const localCategories = computed({
  get: () => props.categories,
  set: (value: AdminCategoryListItem[]) => emit('update:categories', value),
});

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.categories.length === 0) {
    return false;
  }

  const selectedLoaded = props.categories.filter((category) =>
    selectedSet.value.has(category.id),
  ).length;

  if (selectedLoaded === 0) {
    return false;
  }

  if (selectedLoaded === props.categories.length) {
    return true;
  }

  return 'indeterminate';
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const loadedIds = new Set(props.categories.map((category) => category.id));
    selectedIds.value = selectedIds.value.filter((id) => !loadedIds.has(id));
    return;
  }

  const merged = new Set(selectedIds.value);
  for (const category of props.categories) {
    merged.add(category.id);
  }
  selectedIds.value = [...merged];
}

function toggleRow(categoryId: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) {
    next.add(categoryId);
  } else {
    next.delete(categoryId);
  }
  selectedIds.value = [...next];
}
</script>

<template>
  <TableShell :class="[ORDER_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: tableGridTemplate }">
        <TableCell v-if="rearrangeMode" />
        <TableCell v-else class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all categories on this page"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Category</TableCell>
        <TableCell>Description</TableCell>
        <TableCell class="pr-4 text-right">Products</TableCell>
        <TableCell v-if="!rearrangeMode" class="!pl-0" />
      </TableHeadRow>
    </TableHeader>

    <div
      v-if="loading"
      class="min-h-0 flex-1 overflow-hidden"
    >
      <TableSkeleton
        :columns="skeletonColumns"
        :grid-template-columns="tableGridTemplate"
        :row-count="10"
      />
    </div>

    <draggable
      v-else-if="rearrangeMode"
      v-model="localCategories"
      item-key="id"
      tag="div"
      handle=".category-drag-handle"
      class="divide-y divide-grey-50"
      :animation="180"
      ghost-class="opacity-50"
    >
      <template #item="{ element: category }">
        <div
          :style="{ display: 'grid', gridTemplateColumns: tableGridTemplate }"
          class="items-center gap-3 bg-white px-4 py-3"
        >
          <div class="flex items-center justify-center">
            <button
              type="button"
              class="category-drag-handle flex size-9 cursor-grab items-center justify-center rounded-lg text-grey-400 active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical class="size-4" />
            </button>
          </div>
          <div class="flex min-w-0 items-center gap-3">
            <div
              v-if="category.imageUrl"
              class="size-10 shrink-0 overflow-hidden rounded-lg border border-grey-50 bg-grey-55"
            >
              <img :src="category.imageUrl" :alt="category.name" class="size-full object-cover">
            </div>
            <div
              v-else
              class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-grey-50 bg-grey-55 text-xs font-semibold text-grey-300"
            >
              {{ category.name.charAt(0) }}
            </div>
            <p class="min-w-0 truncate text-sm font-semibold text-grey-900">{{ category.name }}</p>
          </div>
          <p class="line-clamp-2 text-sm text-grey-700">{{ category.description }}</p>
          <p class="pr-4 text-right text-sm font-medium text-grey-900">
            {{ category.productCountLabel }}
          </p>
        </div>
      </template>
    </draggable>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="category in categories"
        :key="category.id"
        class="cursor-pointer transition-colors hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: tableGridTemplate }"
        @click="emit('view', category)"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(category.id)"
            :aria-label="`Select ${category.name}`"
            @update:model-value="toggleRow(category.id, $event)"
          />
        </TableCell>

        <TableCell>
          <div class="flex min-w-0 items-center gap-3">
            <div
              v-if="category.imageUrl"
              class="size-10 shrink-0 overflow-hidden rounded-lg border border-grey-50 bg-grey-55"
            >
              <img :src="category.imageUrl" :alt="category.name" class="size-full object-cover">
            </div>
            <div
              v-else
              class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-grey-50 bg-grey-55 text-xs font-semibold text-grey-300"
            >
              {{ category.name.charAt(0) }}
            </div>
            <p class="min-w-0 truncate text-sm font-semibold text-grey-900">{{ category.name }}</p>
          </div>
        </TableCell>
        <TableCell>
          <p class="line-clamp-2 text-sm text-grey-700">{{ category.description }}</p>
        </TableCell>
        <TableCell class="pr-4 text-right text-sm font-medium text-grey-900">
          {{ category.productCountLabel }}
        </TableCell>
        <TableCell class="!pl-0 pr-1 flex justify-end" @click.stop>
          <CategoryActionsMenu
            :category="category"
            :disabled="actionsDisabled || busyCategoryId === category.id"
            @view="emit('view', category)"
            @edit="emit('edit', category)"
            @delete="emit('delete', category)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!rearrangeMode && meta.total > 0">
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
