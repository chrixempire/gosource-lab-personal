<script setup lang="ts">
import {
  Avatar,
  Checkbox,
  PaginationBar,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeadRow,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import SortKiteIcon from '~/components/shared/collection/SortKiteIcon.vue';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/customer-table-layout';
import BranchActionsMenu from './BranchActionsMenu.vue';
import type { BranchListItem } from './BranchCards.vue';

const props = defineProps<{
  branches: BranchListItem[];
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  loading?: boolean;
  canManage?: boolean;
}>();

const emit = defineEmits<{
  sort: [key: string];
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [branch: BranchListItem];
  view: [branch: BranchListItem];
  invite: [branch: BranchListItem];
  edit: [branch: BranchListItem];
  activate: [branch: BranchListItem];
  deactivate: [branch: BranchListItem];
  delete: [branch: BranchListItem];
}>();

const columns = [
  { key: 'branchName', label: 'Branch', width: 'minmax(0,2.5fr)' },
  { key: 'branchCode', label: 'Branch code', width: 'minmax(0,1.1fr)' },
  { key: 'totalAmount', label: 'Total amount', width: 'minmax(0,1fr)' },
  { key: 'createdAt', label: 'Created date', width: 'minmax(0,1fr)' },
  { key: 'membersCount', label: 'Members', width: 'minmax(0,0.8fr)' },
  { key: 'isDeactivated', label: 'Status', width: 'minmax(0,0.75fr)' },
];

const selectedIds = ref<string[]>([]);

const skeletonColumns = computed(() =>
  [
    ...(props.canManage === false ? [] : [{ kind: 'checkbox' as const }]),
    {
      kind: 'stack' as const,
      avatar: true,
    },
    { kind: 'line' as const, lineClass: 'w-full' },
    { kind: 'line' as const, lineClass: 'w-full' },
    { kind: 'line' as const, lineClass: 'w-full' },
    { kind: 'line' as const, lineClass: 'w-full' },
    { kind: 'line' as const, lineClass: 'w-full' },
    ...(props.canManage === false ? [] : [{ kind: 'action' as const }]),
  ]
);

const tableGridTemplate = computed(() =>
  props.canManage === false
    ? 'minmax(0,2.5fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.75fr)'
    : '44px minmax(0,2.5fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.75fr) 60px',
);

const allSelected = computed(() => {
  return props.branches.length > 0 && props.branches.every((branch) => selectedIds.value.includes(branch.id));
});

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedIds.value.length === 0) {
    return false;
  }

  if (props.canManage === false) {
    return false;
  }

  if (allSelected.value) {
    return true;
  }

  return 'indeterminate';
});

watch(
  () => props.branches.map((branch) => branch.id),
  (ids) => {
    selectedIds.value = selectedIds.value.filter((id) => ids.includes(id));
  },
  { immediate: true },
);

function toggleAllRows() {
  if (allSelected.value) {
    selectedIds.value = [];
    return;
  }

  selectedIds.value = props.branches.map((branch) => branch.id);
}

function toggleRowSelection(branchId: string) {
  if (props.canManage === false) {
    return;
  }

  if (selectedIds.value.includes(branchId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== branchId);
    return;
  }

  selectedIds.value = [...selectedIds.value, branchId];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(amount);
}
</script>

<template>
  <TableShell :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
    <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
      <TableHeadRow
        :style="{ gridTemplateColumns: tableGridTemplate }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell v-if="canManage !== false" class="flex items-center justify-center">
          <Checkbox
            :model-value="selectionState"
            :disabled="loading"
            aria-label="Select all branches"
            @update:model-value="toggleAllRows"
          />
        </TableCell>

        <button
          v-for="column in columns"
          :key="column.key"
          type="button"
          class="flex items-center gap-2 text-left cursor-pointer"
          @click="emit('sort', column.key)"
        >
          <span>{{ column.label }}</span>
          <SortKiteIcon
            :direction="sortKey === column.key ? sortDirection : null"
          />
        </button>
        <TableCell v-if="canManage !== false" />
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="skeletonColumns"
      :grid-template-columns="tableGridTemplate"
      :body-class="CUSTOMER_TABLE_BODY_CLASS"
    />

    <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
        <TableRow
          v-for="branch in branches"
          :key="branch.id"
          class="cursor-pointer transition-colors duration-150 hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
          :style="{ gridTemplateColumns: tableGridTemplate }"
          @click="emit('rowClick', branch)"
        >
          <TableCell v-if="canManage !== false" class="flex items-center justify-center">
            <Checkbox
              :model-value="selectedIds.includes(branch.id)"
              :aria-label="`Select ${branch.branchName}`"
              @update:model-value="toggleRowSelection(branch.id)"
              @click.stop
            />
          </TableCell>

          <TableCell class="flex items-center gap-3">
            <Avatar
              size="sm"
              :src="branch.avatarUrl"
              :alt="branch.branchName"
              :fallback="branch.initials"
            />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate text-base font-semibold text-grey-900">
                  {{ branch.branchName }}
                </p>
                <span
                  v-if="branch.isHeadquarter"
                  class="inline-flex shrink-0 rounded-full bg-[linear-gradient(90deg,#F7931A_0%,#EC4899_100%)] px-2.5 py-1 text-[10px] font-semibold leading-none text-white"
                >
                  Headquarter
                </span>
              </div>
              <p class="truncate text-sm text-grey-300">
                {{ branch.addressLine }}
              </p>
            </div>
          </TableCell>

          <TableCell>
            <p class="text-sm font-medium text-grey-900">
              {{ branch.branchCode }}
            </p>
          </TableCell>

          <TableCell>
            <p class="text-sm font-medium text-grey-900">
              {{ formatCurrency(branch.totalAmount) }}
            </p>
          </TableCell>

          <TableCell>
            <p class="text-sm font-medium text-grey-900">
              {{ branch.createdDateLabel }}
            </p>
          </TableCell>

          <TableCell>
            <p class="text-sm font-medium text-grey-900">
              {{ branch.membersCount }}
            </p>
          </TableCell>

          <TableCell>
            <StatusTag
              :variant="branch.statusVariant"
              size="medium"
              class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
            >
              {{ branch.statusLabel }}
            </StatusTag>
          </TableCell>

          <TableCell v-if="canManage !== false" class="flex justify-end">
            <BranchActionsMenu
              :hidden="false"
              :is-deactivated="branch.isDeactivated"
              @view="emit('view', branch)"
              @invite="emit('invite', branch)"
              @edit="emit('edit', branch)"
              @activate="emit('activate', branch)"
              @deactivate="emit('deactivate', branch)"
              @delete="emit('delete', branch)"
            />
          </TableCell>
        </TableRow>

      <div
        v-if="branches.length === 0"
        class="flex min-h-[220px] items-center justify-center px-6 text-sm text-grey-300"
      >
        No branches found for this view.
      </div>
    </TableBody>

    <TableFooter>
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        :disabled="loading"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
