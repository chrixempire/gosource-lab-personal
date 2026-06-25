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
  rowClick: [row: AdminActivityLogItem];
}>();

const gridStyle = { gridTemplateColumns: ACTIVITY_LOG_TABLE_GRID };

const skeletonColumns = [
  { kind: 'line' as const, lineClass: 'w-28' }, // Time
  { kind: 'line' as const, lineClass: 'w-24' }, // Module
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' }, // Action
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' }, // Initiator (name + type)
  { kind: 'line' as const, lineClass: 'w-28' }, // Role
  { kind: 'line' as const, lineClass: 'w-full' }, // Description
  { kind: 'line' as const, lineClass: 'w-8' }, // link
];

function actionVariant(action: string) {
  const normalized = action.toUpperCase();
  if (normalized === 'CREATE') return 'success';
  if (normalized === 'UPDATE') return 'warning';
  if (normalized === 'DELETE') return 'negative';
  return 'default';
}

const MODULE_LABELS: Record<string, string> = {
  product: 'Items',
  category: 'Categories',
  purchaseorder: 'Purchase order',
};

function moduleLabel(module: string) {
  return MODULE_LABELS[module.trim().toLowerCase()] ?? module;
}

function initiatorTypeLabel(type: string) {
  const normalized = type.trim().toUpperCase();
  if (normalized === 'ADMIN') return 'Admin';
  if (normalized === 'BUSINESS') return 'Business';
  return type;
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
        <TableCell>Initiator</TableCell>
        <TableCell>Role</TableCell>
        <TableCell>Description</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 w-full flex-1 overflow-hidden">
      <TableSkeleton
        :columns="skeletonColumns"
        :grid-template-columns="ACTIVITY_LOG_TABLE_GRID"
        :row-count="10"
        row-class="min-h-16 w-full min-w-full bg-background-on-canvas py-2.5"
        body-class="w-full !max-h-none !overflow-visible !pt-0"
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
        class="cursor-pointer transition-colors hover:bg-primary-50/45"
        @click="emit('rowClick', row)"
      >
        <TableCell class="text-sm text-grey-700">{{ row.createdAtLabel }}</TableCell>
        <TableCell class="text-sm text-grey-700">{{ moduleLabel(row.module) }}</TableCell>
        <TableCell>
          <StatusTag :variant="actionVariant(row.action)" size="medium">
            {{ row.action }}
          </StatusTag>
        </TableCell>
        <TableCell>
          <p class="truncate text-sm font-medium text-grey-900">
            {{ row.initiatorName || 'Unknown' }}
          </p>
          <p class="truncate text-xs text-grey-500">
            {{ initiatorTypeLabel(row.initiatorType) }}
          </p>
        </TableCell>
        <TableCell class="text-sm text-grey-700">
          {{ row.initiatorRole || '—' }}
        </TableCell>
        <TableCell class="truncate text-sm text-grey-900">{{ row.description }}</TableCell>
        <TableCell>
          <NuxtLink
            v-if="row.objectLink"
            :to="row.objectLink"
            class="text-sm font-medium text-primary-700 hover:underline"
            @click.stop
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
