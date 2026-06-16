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
import ListActionsMenu from '~/components/lists/ListActionsMenu.vue';
import ListCoverImage from '~/components/lists/ListCoverImage.vue';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_DATA_ROW_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/customer-table-layout';
import type { ShoppingListListItem } from '~/lib/shopping-list';
import { formatShoppingListCurrency, formatShoppingListDate } from '~/lib/shopping-list';

const props = withDefaults(defineProps<{
  lists: ShoppingListListItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  loading?: boolean;
  showBranchColumn?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}>(), {
  emptyTitle: 'No lists yet',
  emptyDescription: 'Create a list to save products your branch orders often.',
});

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [list: ShoppingListListItem];
  view: [list: ShoppingListListItem];
  move: [list: ShoppingListListItem];
  edit: [list: ShoppingListListItem];
  delete: [list: ShoppingListListItem];
  selectionChange: [ids: string[]];
}>();

const tableGridTemplate = computed(() =>
  props.showBranchColumn
    ? '44px minmax(0,1.2fr) minmax(0,0.9fr) minmax(0,0.45fr) minmax(0,0.7fr) minmax(0,0.7fr) 3rem'
    : '44px minmax(0,1.4fr) minmax(0,0.45fr) minmax(0,0.7fr) minmax(0,0.7fr) 3rem',
);

const skeletonColumns = computed(() => {
  const base = [
    { kind: 'checkbox' as const },
    {
      kind: 'stack' as const,
      avatar: true,
      lineClass: 'w-full',
      sublineClass: 'w-4/5',
    },
  ] as const;

  if (props.showBranchColumn) {
    return [...base, { kind: 'line' as const, lineClass: 'w-24' }];
  }

  return [...base];
});

const skeletonTail = [
  { kind: 'line' as const, lineClass: 'w-12' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'h-8 w-8' },
] as const;

const skeletonColumnsFull = computed(() => [...skeletonColumns.value, ...skeletonTail]);

const selectedIds = ref<string[]>([]);

const allSelected = computed(
  () => props.lists.length > 0 && props.lists.every((list) => selectedIds.value.includes(list.id)),
);

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedIds.value.length === 0) {
    return false;
  }

  if (allSelected.value) {
    return true;
  }

  return 'indeterminate';
});

watch(
  () => props.lists.map((list) => list.id),
  (ids) => {
    selectedIds.value = selectedIds.value.filter((id) => ids.includes(id));
    emit('selectionChange', [...selectedIds.value]);
  },
  { immediate: true },
);

function toggleAllRows() {
  if (allSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = props.lists.map((list) => list.id);
  }

  emit('selectionChange', [...selectedIds.value]);
}

function toggleRowSelection(listId: string) {
  if (selectedIds.value.includes(listId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== listId);
  } else {
    selectedIds.value = [...selectedIds.value, listId];
  }

  emit('selectionChange', [...selectedIds.value]);
}

const showEmpty = computed(() => !props.loading && props.lists.length === 0);
const showPagination = computed(
  () => !props.loading && (props.lists.length > 0 || props.totalItems > 0),
);
const hasNextPage = computed(() => props.hasNextPage ?? props.page < props.totalPages);
const hasPrevPage = computed(() => props.hasPrevPage ?? props.page > 1);
</script>

<template>
  <TableShell :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
    <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
      <TableHeadRow
        :style="{ gridTemplateColumns: tableGridTemplate }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell class="flex items-center justify-center">
          <Checkbox
            :model-value="selectionState"
            :disabled="loading"
            aria-label="Select all lists"
            @update:model-value="toggleAllRows"
          />
        </TableCell>
        <TableCell>List name</TableCell>
        <TableCell v-if="showBranchColumn">Branch</TableCell>
        <TableCell>Items</TableCell>
        <TableCell>Amount</TableCell>
        <TableCell>Updated</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="skeletonColumnsFull"
      :grid-template-columns="tableGridTemplate"
      :body-class="CUSTOMER_TABLE_BODY_CLASS"
    />

    <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
      <TableRow
        v-for="list in lists"
        :key="list.id"
        :class="CUSTOMER_TABLE_DATA_ROW_CLASS"
        :style="{ gridTemplateColumns: tableGridTemplate }"
        @click="emit('rowClick', list)"
      >
        <TableCell class="flex items-center justify-center">
          <Checkbox
            :model-value="selectedIds.includes(list.id)"
            :aria-label="`Select ${list.name}`"
            @update:model-value="toggleRowSelection(list.id)"
            @click.stop
          />
        </TableCell>
        <TableCell class="flex items-center gap-3">
          <ListCoverImage
            :src="list.coverImageUrl"
            :alt="list.name"
            shape="circle"
          />
          <div class="min-w-0">
            <p class="truncate font-medium text-grey-900">{{ list.name }}</p>
            <p v-if="list.description" class="mt-0.5 truncate text-xs text-grey-300">
              {{ list.description }}
            </p>
          </div>
        </TableCell>
        <TableCell v-if="showBranchColumn">
          <p class="truncate text-sm text-grey-800">{{ list.branchName }}</p>
        </TableCell>
        <TableCell>{{ list.itemCount }}</TableCell>
        <TableCell>{{ formatShoppingListCurrency(list.amount) }}</TableCell>
        <TableCell>{{ formatShoppingListDate(list.updatedAt) }}</TableCell>
        <TableCell class="flex items-center justify-end">
          <ListActionsMenu
            @view="emit('view', list)"
            @move="emit('move', list)"
            @edit="emit('edit', list)"
            @delete="emit('delete', list)"
          />
        </TableCell>
      </TableRow>

      <div
        v-if="showEmpty"
        class="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">{{ emptyTitle }}</p>
        <p v-if="emptyDescription" class="mt-2 text-sm text-grey-300">
          {{ emptyDescription }}
        </p>
      </div>
    </TableBody>

    <TableFooter v-if="showPagination">
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :visible-count="lists.length"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        :disabled="loading"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
