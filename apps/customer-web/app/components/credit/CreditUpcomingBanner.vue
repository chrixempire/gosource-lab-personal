<script setup lang="ts">
import type { CustomerUpcomingCreditPayment } from '~/types/credit';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';

const props = defineProps<{
  upcoming: CustomerUpcomingCreditPayment;
}>();
</script>

<template>
  <div
    v-if="props.upcoming && props.upcoming.totalNextPaymentKobo > 0"
    class="mb-6 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-grey-700"
  >
    <p class="font-medium text-grey-900">Upcoming payment</p>
    <p class="mt-1">
      {{ formatCreditFromKobo(props.upcoming.totalNextPaymentKobo) }}
      <span v-if="props.upcoming.nextDueDate">
        due {{ formatRequestDate(props.upcoming.nextDueDate) }}
      </span>
      <span v-if="props.upcoming.overdueCount > 0">
        · {{ props.upcoming.overdueCount }} overdue installment(s) ({{
          formatCreditFromKobo(props.upcoming.totalOverdueKobo)
        }})
      </span>
    </p>
  </div>
</template>
