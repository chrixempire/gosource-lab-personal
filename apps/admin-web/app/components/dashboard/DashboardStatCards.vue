<script setup lang="ts">
import DashboardStatCard from '~/components/dashboard/DashboardStatCard.vue';
import DashboardStatCardSkeleton from '~/components/dashboard/DashboardStatCardSkeleton.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  toDashboardQueryParams,
} from '~/lib/dashboard-date';
import type { DashboardDateFilterValue, DashboardSummaryResponse } from '~/types/dashboard';

const props = defineProps<{
  filter: DashboardDateFilterValue;
}>();

const query = computed(() => toDashboardQueryParams(props.filter));

const { data, pending, error } = await useFetch<DashboardSummaryResponse>('/api/dashboard/summary', {
    query,
    watch: [query],
  },
);

const showSkeleton = computed(() => pending.value);
const hasOrderMetrics = computed(() => data.value?.permissions?.orders ?? Boolean(data.value));
const hasActiveCustomers = computed(
  () => data.value?.permissions?.activeCustomers ?? Boolean(data.value),
);

</script>

<template>
  <section v-if="showSkeleton" class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <DashboardStatCardSkeleton
      v-for="index in 4"
      :key="index"
      class="w-full min-w-0"
    />
  </section>

  <LoadErrorState
    v-else-if="error"
    :error="error"
    load-failed-title="Unable to load summary"
    resource-label="dashboard summary"
    fallback-message="We could not load the dashboard summary for this period. Check your permissions, try another date range, or retry."
    @retry="refresh()"
  />

  <section v-else class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <DashboardStatCard
      v-if="hasOrderMetrics"
      label="Total orders"
      :value="formatDashboardNumber(data?.orders ?? 0)"
      class="w-full min-w-0"
    />
    <DashboardStatCard
      v-else
      label="Total orders"
      value="—"
      hint="Requires order view permission"
      class="w-full min-w-0"
    />

    <DashboardStatCard
      v-if="hasOrderMetrics"
      label="Total order value"
      :value="formatDashboardCurrency(data?.totalOrdersAmount ?? 0)"
      class="w-full min-w-0"
    />
    <DashboardStatCard
      v-else
      label="Total order value"
      value="—"
      hint="Requires order view permission"
      class="w-full min-w-0"
    />

    <DashboardStatCard
      v-if="hasActiveCustomers"
      label="Active customers"
      :value="formatDashboardNumber(data?.activeCustomers ?? 0)"
      indicator-color="bg-emerald-500"
      class="w-full min-w-0"
    />
    <DashboardStatCard
      v-else
      label="Active customers"
      value="—"
      hint="Requires customer view permission"
      indicator-color="bg-emerald-500"
      class="w-full min-w-0"
    />

    <DashboardStatCard
      label="Inactive customers"
      :value="formatDashboardNumber(data?.inactiveCustomers ?? 0)"
      hint="Overall account status"
      indicator-color="bg-red-500"
      class="w-full min-w-0"
    />
  </section>
</template>
