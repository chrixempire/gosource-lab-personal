<script setup lang="ts">
import { creditRepaymentFrequencyLabel } from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import type { CustomerCreditRequestDetail } from '~/types/credit';

const props = defineProps<{
  request: CustomerCreditRequestDetail;
  showApprovedTerms: boolean;
}>();

const principalKobo = computed(() =>
  props.showApprovedTerms
    ? props.request.approvedAmountKobo || props.request.requestedAmountKobo
    : props.request.requestedAmountKobo,
);

const frequencyLabel = computed(() =>
  creditRepaymentFrequencyLabel(
    props.showApprovedTerms
      ? props.request.repaymentFrequency
      : props.request.requestedRepaymentFrequency,
  ),
);

const durationValue = computed(() => {
  const duration = props.showApprovedTerms
    ? props.request.repaymentDuration
    : props.request.requestedRepaymentDuration;
  return duration != null ? String(duration) : '—';
});
</script>

<template>
  <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
    <h2 class="text-base font-semibold text-grey-900">
      {{ showApprovedTerms ? 'Repayment summary' : 'Request terms' }}
    </h2>

    <dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
      <div>
        <dt class="text-xs font-semibold uppercase text-grey-400">Principal</dt>
        <dd class="mt-1 text-sm font-semibold text-grey-900">
          {{ formatCreditFromKobo(principalKobo) }}
        </dd>
      </div>
      <div v-if="showApprovedTerms">
        <dt class="text-xs font-semibold uppercase text-grey-400">Total interest</dt>
        <dd class="mt-1 text-sm font-semibold text-danger-600">
          + {{ formatCreditFromKobo(request.totalInterestAmountKobo) }}
        </dd>
      </div>
      <div v-if="showApprovedTerms">
        <dt class="text-xs font-semibold uppercase text-grey-400">Total repayment</dt>
        <dd class="mt-1 text-sm font-semibold text-grey-900">
          {{ formatCreditFromKobo(request.totalRepaymentAmountKobo) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs font-semibold uppercase text-grey-400">Frequency</dt>
        <dd class="mt-1 text-sm font-medium text-grey-900">{{ frequencyLabel }}</dd>
      </div>
      <div>
        <dt class="text-xs font-semibold uppercase text-grey-400">Duration</dt>
        <dd class="mt-1 text-sm font-medium text-grey-900">{{ durationValue }} installments</dd>
      </div>
      <div v-if="showApprovedTerms && request.interestRate != null">
        <dt class="text-xs font-semibold uppercase text-grey-400">Interest rate</dt>
        <dd class="mt-1 text-sm font-medium text-grey-900">{{ request.interestRate }}%</dd>
      </div>
      <div v-if="showApprovedTerms && request.gracePeriodDays != null">
        <dt class="text-xs font-semibold uppercase text-grey-400">Grace period</dt>
        <dd class="mt-1 text-sm font-medium text-grey-900">{{ request.gracePeriodDays }} day(s)</dd>
      </div>
      <div v-if="showApprovedTerms && request.approvedDate">
        <dt class="text-xs font-semibold uppercase text-grey-400">Approved</dt>
        <dd class="mt-1 text-sm font-medium text-grey-900">
          {{ formatRequestDate(request.approvedDate) }}
        </dd>
      </div>
      <div v-if="showApprovedTerms && request.dueDate">
        <dt class="text-xs font-semibold uppercase text-grey-400">Final due date</dt>
        <dd class="mt-1 text-sm font-medium text-grey-900">{{ formatRequestDate(request.dueDate) }}</dd>
      </div>
    </dl>
  </section>
</template>
