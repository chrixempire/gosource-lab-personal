<script setup lang="ts">
import CreditDocumentRow from '~/components/credit/CreditDocumentRow.vue';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { formatCreditRevenueRange } from '~/lib/credit-api';

const props = defineProps<{
  revenueRange?: string;
  yearOfOperations?: string;
  bankStatementUrl?: string;
}>();

const snapshots = computed(() => [
  { label: 'Monthly revenue range', text: formatCreditRevenueRange(props.revenueRange) },
  { label: 'Years in operation', text: props.yearOfOperations || '—' },
]);
</script>

<template>
  <CreditPanelCard title="Financial snapshots">
    <div class="space-y-6">
      <div
        v-for="(item, index) in snapshots"
        :key="index"
        class="space-y-1"
      >
        <p class="text-xs text-grey-500">{{ item.label }}</p>
        <p class="text-sm font-medium text-grey-900">{{ item.text }}</p>
      </div>

      <CreditDocumentRow
        v-if="bankStatementUrl"
        title="Bank statement"
        :url="bankStatementUrl"
      />
      <p v-else class="text-sm text-grey-500">No bank statement uploaded</p>
    </div>
  </CreditPanelCard>
</template>
