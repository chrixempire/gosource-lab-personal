<script setup lang="ts">
import DashboardOrderTrendsChart from '~/components/dashboard/DashboardOrderTrendsChart.vue';
import DashboardOrderStatusPieChart from '~/components/dashboard/DashboardOrderStatusPieChart.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { parseOrderMetrics } from '~/lib/dashboard-api';
import { toDashboardQueryParams } from '~/lib/dashboard-date';
import type { DashboardDateFilterValue } from '~/types/dashboard';

const props = defineProps<{
  filter: DashboardDateFilterValue;
}>();

const query = computed(() => toDashboardQueryParams(props.filter));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/dashboard/order-metrics', {
  query,
  watch: [query],
  /** Client-only so metrics load after login cookie exists (avoids stale SSR/prefetch). */
  server: false,
});

const metrics = computed(() => parseOrderMetrics(data.value, props.filter));
const trendPoints = computed(() => metrics.value.trendPoints);
const statusSlices = computed(() => metrics.value.statusSlices);
/** Remount charts only when the date filter changes — not when metrics payload arrives. */
const chartKey = computed(() =>
  [props.filter.filterType, props.filter.startDate ?? '', props.filter.endDate ?? ''].join('|'),
);
</script>

<template>
  <section class="min-w-0 space-y-4">
    <LoadErrorState
      v-if="error"
      :error="error"
      load-failed-title="Unable to load charts"
      resource-label="chart metrics"
      fallback-message="We could not load chart metrics for this period. Try again or pick another date range."
      @retry="refresh()"
    />

    <div v-else :key="chartKey" class="flex min-w-0 flex-col gap-4">
      <DashboardOrderTrendsChart
        :points="trendPoints"
        :filter-type="filter.filterType"
        :pending="pending"
      />
      <DashboardOrderStatusPieChart :slices="statusSlices" :pending="pending" />
    </div>
  </section>
</template>
