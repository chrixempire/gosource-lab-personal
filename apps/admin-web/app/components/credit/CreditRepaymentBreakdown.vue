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
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import { parseCreditRepaymentSchedule } from '~/lib/credit-api';
import {
  creditRepaymentScheduleStatusVariant,
} from '~/lib/credit-constants';
import { CREDIT_REPAYMENT_SCHEDULE_TABLE_GRID } from '~/lib/credit-table-layout';

const props = defineProps<{
  requestId: string;
}>();

const page = ref(1);
const limit = ref(25);

const query = computed(() => ({ page: page.value, limit: limit.value }));

const { data, pending } = await useFetch<unknown>(
  () => `/api/credit/requests/${props.requestId}/repayment-schedule`,
  { query, watch: [() => props.requestId, query] },
);

const parsed = computed(() =>
  parseCreditRepaymentSchedule(data.value, page.value, limit.value),
);
</script>

<template>
  <CreditPanelCard title="Repayment breakdown">
    <TableShell class="overflow-visible border-0 shadow-none">
      <TableHeader class="border-b border-grey-50 bg-grey-25">
        <TableHeadRow :style="{ gridTemplateColumns: CREDIT_REPAYMENT_SCHEDULE_TABLE_GRID }">
          <TableCell>Installments</TableCell>
          <TableCell>Due date</TableCell>
          <TableCell>Amount due</TableCell>
          <TableCell>Repayment status</TableCell>
          <TableCell>Reference ID</TableCell>
        </TableHeadRow>
      </TableHeader>

      <div v-if="pending" class="p-4">
        <TableSkeleton
          :columns="Array(5).fill({ kind: 'line' as const, lineClass: 'w-full' })"
          :grid-template-columns="CREDIT_REPAYMENT_SCHEDULE_TABLE_GRID"
          :row-count="6"
        />
      </div>

      <TableBody v-else-if="parsed.rows.length" class="!max-h-none !overflow-visible">
        <TableRow
          v-for="row in parsed.rows"
          :key="row.id"
          class="even:bg-[#FAFBFC]"
          :style="{ gridTemplateColumns: CREDIT_REPAYMENT_SCHEDULE_TABLE_GRID }"
        >
          <TableCell>
            <p class="text-sm font-medium text-grey-900">
              {{ row.installmentNumber || '—' }}
            </p>
          </TableCell>
          <TableCell>
            <p class="text-sm text-grey-800">{{ row.dueDateLabel }}</p>
          </TableCell>
          <TableCell>
            <div class="flex flex-wrap items-center gap-1 text-sm font-medium text-grey-800">
              <span>{{ row.amountDueLabel }}</span>
              <span
                v-if="row.overdueChargesLabel"
                class="text-error-600"
              >
                (-{{ row.overdueChargesLabel }})
              </span>
            </div>
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
            <p class="text-sm font-medium text-grey-800">{{ row.referenceLabel }}</p>
          </TableCell>
        </TableRow>
      </TableBody>

      <p v-else class="py-6 text-center text-sm text-grey-500">No repayment schedule yet.</p>

      <TableFooter v-if="!pending && parsed.meta.total > 0">
        <CreditTablePagination
          :meta="parsed.meta"
          @page="page = $event"
          @page-size="limit = $event; page = 1"
        />
      </TableFooter>
    </TableShell>
  </CreditPanelCard>
</template>
