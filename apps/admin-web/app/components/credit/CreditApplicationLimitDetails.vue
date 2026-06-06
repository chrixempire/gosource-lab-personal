<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { formatCreditFromKobo } from '~/lib/credit-money';
import type { LegacyCreditApplicationRow } from '~/types/credit';

const props = defineProps<{
  credit: LegacyCreditApplicationRow;
}>();

const account = computed(() => props.credit.currentCreditAccount);
const utilization = computed(() => Number(account.value?.creditUtilization) || 0);
const highRisk = computed(() => utilization.value > 70);

const fields = computed(() => [
  {
    label: 'Requested amount',
    text: formatCreditFromKobo(props.credit.requestedAmountKobo),
  },
  {
    label: 'Approved amount',
    text: formatCreditFromKobo(props.credit.approvedAmountKobo),
  },
  {
    label: 'Current credit limit',
    text: formatCreditFromKobo(account.value?.limitKobo),
  },
  {
    label: 'Total credit used',
    text: formatCreditFromKobo(account.value?.outstandingKobo),
  },
  {
    label: 'Credit utilization',
    text: `${utilization.value}%`,
    highRisk: highRisk.value,
  },
  { label: 'Request type', text: 'Limit increase' },
]);
</script>

<template>
  <CreditPanelCard title="Credit request details">
    <div class="flex flex-wrap gap-6">
      <div
        v-for="(field, index) in fields"
        :key="index"
        class="space-y-1"
      >
        <p class="text-xs uppercase tracking-wide text-grey-500">{{ field.label }}</p>
        <p class="text-sm font-medium text-grey-900">{{ field.text }}</p>
        <StatusTag
          v-if="field.highRisk"
          variant="default"
          class="text-[0.625rem]"
        >
          High credit risk
        </StatusTag>
      </div>
    </div>
  </CreditPanelCard>
</template>
