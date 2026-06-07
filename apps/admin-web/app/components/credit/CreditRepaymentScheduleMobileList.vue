<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import { creditRepaymentScheduleStatusVariant } from '~/lib/credit-constants';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';

type ScheduleRow = {
  id: string;
  installmentNumber?: number | string | null;
  dueDateLabel: string;
  amountDueLabel: string;
  overdueChargesLabel?: string | null;
  status: string;
  statusLabel: string;
  referenceLabel: string;
};

defineProps<{
  rows: ScheduleRow[];
  loading?: boolean;
}>();
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" :count="6" />

  <p
    v-else-if="!rows.length"
    class="rounded-xl border border-grey-50 bg-white px-4 py-8 text-center text-sm text-grey-500"
  >
    No repayment schedule yet.
  </p>

  <div v-else :class="CREDIT_CARDS_GRID_CLASS">
    <article
      v-for="row in rows"
      :key="row.id"
      :class="[CREDIT_CARD_SHELL_CLASS, 'cursor-default hover:bg-white hover:border-grey-50']"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold text-grey-900">
          Installment {{ row.installmentNumber || '—' }}
        </p>
        <StatusTag :variant="creditRepaymentScheduleStatusVariant(row.status)" class="capitalize">
          {{ row.statusLabel }}
        </StatusTag>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <AdminMobileCardStat label="Due date">{{ row.dueDateLabel }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Reference">{{ row.referenceLabel }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Amount due" class="col-span-2">
          {{ row.amountDueLabel }}
          <span v-if="row.overdueChargesLabel" class="text-error-600">
            (-{{ row.overdueChargesLabel }})
          </span>
        </AdminMobileCardStat>
      </div>
    </article>
  </div>
</template>
