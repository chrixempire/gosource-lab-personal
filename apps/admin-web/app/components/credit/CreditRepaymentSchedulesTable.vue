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
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import { creditRepaymentScheduleStatusVariant } from '~/lib/credit-constants';
import { creditRequestPath } from '~/lib/admin-routes';
import { CREDIT_LIST_PANEL_CLASS, CREDIT_SCHEDULE_LIST_TABLE_GRID } from '~/lib/credit-table-layout';
import type { AdminRepaymentScheduleListItem } from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  rows: AdminRepaymentScheduleListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  showDaysOverdue?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
}>();

function openRequest(row: AdminRepaymentScheduleListItem) {
  if (row.creditRequestId) {
    void navigateTo(creditRequestPath(row.creditRequestId));
  }
}
</script>

<template>
  <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: CREDIT_SCHEDULE_LIST_TABLE_GRID }">
        <TableCell>Business</TableCell>
        <TableCell>Installment</TableCell>
        <TableCell>Due date</TableCell>
        <TableCell>Amount due</TableCell>
        <TableCell>Remaining</TableCell>
        <TableCell>Status</TableCell>
        <TableCell v-if="showDaysOverdue">Days overdue</TableCell>
        <TableCell v-else>Reference</TableCell>
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="p-4">
      <TableSkeleton
        :columns="Array(7).fill({ kind: 'line' as const, lineClass: 'w-full' })"
        :grid-template-columns="CREDIT_SCHEDULE_LIST_TABLE_GRID"
        :row-count="10"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="row in rows"
        :key="row.id"
        class="cursor-pointer even:bg-[#FAFBFC]"
        :style="{ gridTemplateColumns: CREDIT_SCHEDULE_LIST_TABLE_GRID }"
        @click="openRequest(row)"
      >
        <TableCell>
          <p class="truncate text-sm font-medium text-grey-900">{{ row.displayName }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-800">{{ row.installmentNumber || '—' }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm text-grey-800">{{ row.dueDateLabel }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">{{ row.amountDueLabel }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">{{ row.remainingAmountLabel }}</p>
        </TableCell>
        <TableCell>
          <StatusTag
            :variant="creditRepaymentScheduleStatusVariant(row.status)"
            class="capitalize"
          >
            {{ row.statusLabel }}
          </StatusTag>
        </TableCell>
        <TableCell>
          <p v-if="showDaysOverdue" class="text-sm font-medium text-error-600">
            {{ row.daysOverdue ?? '—' }}
          </p>
          <p v-else class="text-sm font-medium text-grey-800">{{ row.referenceLabel }}</p>
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && meta.total > 0">
      <CreditTablePagination
        :meta="meta"
        @page="emit('page', $event)"
        @page-size="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
