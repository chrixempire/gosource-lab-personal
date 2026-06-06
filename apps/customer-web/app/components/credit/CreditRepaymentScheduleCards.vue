<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import {
  creditRepaymentScheduleStatusLabel,
  creditRepaymentScheduleStatusVariant,
} from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import type { CustomerCreditRepaymentSchedule } from '~/types/credit';

defineProps<{
  items: CustomerCreditRepaymentSchedule[];
}>();

const cardArticleClass =
  'rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)]';
</script>

<template>
  <div v-if="!items.length" class="rounded-[16px] border border-grey-50 bg-background-on-canvas px-6 py-10 text-center">
    <p class="text-sm text-grey-400">No repayment schedule yet.</p>
  </div>

  <div v-else class="grid gap-4">
    <article v-for="schedule in items" :key="schedule.id" :class="cardArticleClass">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold text-grey-900">
          Installment {{ schedule.installmentNumber || '—' }}
        </p>
        <StatusTag :variant="creditRepaymentScheduleStatusVariant(schedule.status)">
          {{ creditRepaymentScheduleStatusLabel(schedule.status) }}
        </StatusTag>
      </div>

      <dl class="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt class="text-grey-300">Due date</dt>
          <dd class="font-medium text-grey-900">{{ formatRequestDate(schedule.dueDate) }}</dd>
        </div>
        <div>
          <dt class="text-grey-300">Amount due</dt>
          <dd class="font-medium text-grey-900">
            {{ formatCreditFromKobo(schedule.remainingAmountKobo) }}
          </dd>
        </div>
        <div>
          <dt class="text-grey-300">Principal</dt>
          <dd class="font-medium text-grey-900">
            {{ formatCreditFromKobo(schedule.principalAmountKobo) }}
          </dd>
        </div>
        <div>
          <dt class="text-grey-300">Interest</dt>
          <dd class="font-medium text-grey-900">
            {{ formatCreditFromKobo(schedule.interestAmountKobo) }}
          </dd>
        </div>
      </dl>
    </article>
  </div>
</template>
