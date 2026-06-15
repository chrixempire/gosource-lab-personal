<script setup lang="ts">
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import CreditTableEmptyBody from '~/components/credit/CreditTableEmptyBody.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import { creditPaymentStatusLabel, creditPaymentStatusVariant } from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_LIST_PANEL_CLASS, CREDIT_REPAYMENT_TABLE_GRID } from '~/lib/credit-table-layout';
import type { AdminRepaymentListItem, CreditPaymentStatus } from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  rows: AdminRepaymentListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  allowManage?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  updateStatus: [status: CreditPaymentStatus, id: string];
  downloadInvoice: [row: AdminRepaymentListItem];
}>();

</script>

<template>
  <TableShell :class="[CREDIT_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: CREDIT_REPAYMENT_TABLE_GRID }">
        <TableCell class="flex items-center">
          <Checkbox :model-value="false" disabled aria-label="Select repayments" @click.stop />
        </TableCell>
        <TableCell>Ref ID</TableCell>
        <TableCell>Business name</TableCell>
        <TableCell>Payment date</TableCell>
        <TableCell>Amount paid</TableCell>
        <TableCell>Method</TableCell>
        <TableCell>Status</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="p-4">
      <TableSkeleton
        :columns="Array(8).fill({ kind: 'line' as const, lineClass: 'w-full' })"
        :grid-template-columns="CREDIT_REPAYMENT_TABLE_GRID"
        :row-count="10"
      />
    </div>

    <CreditTableEmptyBody
      v-else-if="rows.length === 0"
      :title="emptyTitle ?? 'No repayments found'"
      :description="emptyDescription"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="row in rows"
        :key="row.id"
        class="bg-white"
        :style="{ gridTemplateColumns: CREDIT_REPAYMENT_TABLE_GRID }"
      >
        <TableCell @click.stop>
          <Checkbox :model-value="false" disabled />
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-900">{{ row.referenceCode }}</p>
        </TableCell>
        <TableCell>
          <p class="truncate text-sm font-medium text-grey-900">{{ row.businessName }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">{{ row.paymentDateLabel }}</p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">
            {{ formatCreditFromKobo(row.amountKobo) }}
          </p>
        </TableCell>
        <TableCell>
          <p class="text-sm font-medium text-grey-800">{{ row.paymentMethodLabel }}</p>
        </TableCell>
        <TableCell @click.stop>
          <div
            v-if="row.status === 'PENDING_APPROVAL' && allowManage"
            class="flex flex-wrap gap-1"
          >
            <Button
              type="button"
              size="small"
              variant="primary"
              @click="emit('updateStatus', 'COMPLETED', row.id)"
            >
              Confirm
            </Button>
            <Button
              type="button"
              size="small"
              variant="outline"
              @click="emit('updateStatus', 'CANCELLED', row.id)"
            >
              Reject
            </Button>
          </div>
          <StatusTag
            v-else
            :variant="creditPaymentStatusVariant(row.status)"
            size="medium"
          >
            {{ creditPaymentStatusLabel(row.status) }}
          </StatusTag>
        </TableCell>
        <TableCell class="flex justify-end" @click.stop>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <CreditTableActionsTrigger aria-label="Repayment actions" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="emit('downloadInvoice', row)">
                Download invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
