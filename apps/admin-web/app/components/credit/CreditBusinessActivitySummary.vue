<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { formatCreditDate, parseCustomerOrdersSummary } from '~/lib/credit-api';
import { creditStatusVariant, creditWorkflowStatusLabel } from '~/lib/credit-constants';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import type { CreditWorkflowStatus } from '~/types/credit';

const props = defineProps<{
  businessId: string;
  creditStatus: CreditWorkflowStatus | string | undefined;
}>();

const businessId = toRef(props, 'businessId');

const { data, pending } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/customers/${businessId.value}/orders-summary`,
  {
    watch: [businessId],
    key: computed(() => `admin-customer-orders-summary:${businessId.value}`),
  },
);

const summary = computed(() => parseCustomerOrdersSummary(data.value));

const items = computed(() => [
  { label: 'Total orders', text: String(summary.value.totalOrders) },
  {
    label: 'Average monthly spend',
    text: formatDashboardCurrency(summary.value.avgMonthlySpend),
  },
  {
    label: 'Last order date',
    text: summary.value.lastOrder ? formatCreditDate(summary.value.lastOrder) : '—',
  },
  { label: 'Disputes', text: 'None' },
]);
</script>

<template>
  <CreditPanelCard title="Business activity summary">
    <div
      v-if="pending"
      class="text-sm text-grey-500"
    >
      Loading activity…
    </div>
    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-8"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="space-y-1"
      >
        <p class="text-xs text-grey-500">{{ item.label }}</p>
        <p class="text-sm font-medium text-grey-900">{{ item.text }}</p>
      </div>
      <div class="space-y-1">
        <p class="text-xs text-grey-500">Credit status</p>
        <StatusTag :variant="creditStatusVariant(creditStatus)" class="capitalize">
          {{ creditWorkflowStatusLabel(creditStatus) }}
        </StatusTag>
      </div>
    </div>
  </CreditPanelCard>
</template>
