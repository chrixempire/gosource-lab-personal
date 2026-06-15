<script setup lang="ts">
import {
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
import CreditTableEmptyBody from '~/components/credit/CreditTableEmptyBody.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import { ACTIVITY_LOG_TABLE_GRID } from '~/lib/activity-log-table-layout';
import { CREDIT_LIST_PANEL_CLASS } from '~/lib/credit-table-layout';
import type { AdminActivityLogItem } from '~/types/activity-log';
import type { InventoryTableMeta } from '~/types/inventory';

defineProps<{
  rows: AdminActivityLogItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
}>();

const gridStyle = { gridTemplateColumns: ACTIVITY_LOG_TABLE_GRID };

const skeletonColumns = [
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
  { kind: 'line' as const, lineClass: 'w-full' },
];

function actionVariant(action: string) {
  const normalized = action.toUpperCase();
  if (normalized === 'CREATE') return 'success';
  if (normalized === 'UPDATE') return 'warning';
  if (normalized === 'DELETE') return 'negative';
  return 'default';
}
</script>

<template>
  <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="gridStyle">
        <TableCell>Time</TableCell>
        <TableCell>Module</TableCell>
        <TableCell>Action</TableCell>
        <TableCell>Actor</TableCell>
        <TableCell>Description</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1 overflow-hidden">
      <TableSkeleton
        :columns="skeletonColumns"
        :grid-template-columns="ACTIVITY_LOG_TABLE_GRID"
        :row-count="10"
        body-class="!max-h-none !overflow-visible"
      />
    </div>

    <CreditTableEmptyBody
      v-else-if="rows.length === 0"
      title="No activity recorded yet"
      description="Actions logged by the system will appear here. Coverage expands as more admin operations are instrumented."
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="row in rows"
        :key="row.id"
        :style="gridStyle"
      >
        <TableCell class="text-sm text-grey-700">{{ row.createdAtLabel }}</TableCell>
        <TableCell class="text-sm text-grey-700">{{ row.module }}</TableCell>
        <TableCell>
          <StatusTag :variant="actionVariant(row.action)" size="medium">
            {{ row.action }}
          </StatusTag>
        </TableCell>
        <TableCell class="text-sm text-grey-700">{{ row.initiatorType }}</TableCell>
        <TableCell class="text-sm text-grey-900">{{ row.description }}</TableCell>
        <TableCell>
          <NuxtLink
            v-if="row.objectLink"
            :to="row.objectLink"
            class="text-sm font-medium text-primary-700 hover:underline"
          >
            View
          </NuxtLink>
          <span v-else class="text-sm text-grey-400">—</span>
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && rows.length > 0">
      <CreditTablePagination
        :meta="meta"
        @page="emit('page', $event)"
        @page-size="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
