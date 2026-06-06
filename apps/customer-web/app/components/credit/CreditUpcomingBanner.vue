<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import type { CustomerUpcomingCreditPayment } from '~/types/credit';
import { formatCreditFromKobo } from '~/lib/credit-money';

const props = defineProps<{
  upcoming: CustomerUpcomingCreditPayment;
}>();

function formatCreditDueDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
</script>

<template>
  <div
    v-if="props.upcoming && props.upcoming.totalNextPaymentKobo > 0"
    class="customer-surface-card rounded-lg px-4 py-3"
  >
    <div class="flex flex-col gap-1.5">
      <StatusTag
        variant="warning"
        size="medium"
        class="w-fit rounded-full px-2.5 py-0.5 normal-case"
      >
        Upcoming Repayment
      </StatusTag>

      <p class="text-sm font-semibold text-grey-900">🔔 Repayment Reminder</p>

      <p class="text-sm leading-5 text-grey-400">
        Your next repayment of
        <span class="font-semibold text-grey-900">
          {{ formatCreditFromKobo(props.upcoming.totalNextPaymentKobo) }}
        </span>
        <template v-if="props.upcoming.nextDueDate">
          is due on
          <span class="font-semibold text-grey-900">
            {{ formatCreditDueDate(props.upcoming.nextDueDate) }}
          </span>.
        </template>
        Stay on track to keep using your GoSource Credit!
      </p>

      <p
        v-if="props.upcoming.overdueCount > 0"
        class="text-sm leading-5 text-grey-400"
      >
        {{ props.upcoming.overdueCount }} overdue installment(s) totalling
        <span class="font-semibold text-grey-900">
          {{ formatCreditFromKobo(props.upcoming.totalOverdueKobo) }}
        </span>.
      </p>
    </div>
  </div>
</template>
