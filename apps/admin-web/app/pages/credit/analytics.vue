<script setup lang="ts">
import CreditAnalyticsCharts from '~/components/credit/CreditAnalyticsCharts.vue';
import CreditAnalyticsPerformersTable from '~/components/credit/CreditAnalyticsPerformersTable.vue';
import CreditAnalyticsStatCards from '~/components/credit/CreditAnalyticsStatCards.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { parseCreditAnalyticsSummary, parseCreditTopPerformers } from '~/lib/credit-api';

const { updateHeader } = useAdminHeader();

const { data: summaryData, pending: summaryPending } = useFetch<unknown>(
  '/api/credit/analytics/summary',
);
const summary = computed(() => parseCreditAnalyticsSummary(summaryData.value));

const { data: performersData, pending: performersPending } = useFetch<unknown>(
  '/api/credit/analytics/top-performers',
  { query: { page: 1, limit: 10 } },
);
const performers = computed(() => parseCreditTopPerformers(performersData.value));

updateHeader({ title: 'Analytics' });
useHead({ title: 'Credit analytics' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <CreditAnalyticsStatCards :summary="summary" :loading="summaryPending" />

    <ClientOnly>
      <CreditAnalyticsCharts class="min-w-0" />
    </ClientOnly>

    <CreditAnalyticsPerformersTable
      class="min-w-0"
      :rows="performers"
      :loading="performersPending"
    />
  </div>
</template>
