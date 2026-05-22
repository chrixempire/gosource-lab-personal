<script setup lang="ts">
import DashboardOrderTrendsChart from '~/components/dashboard/DashboardOrderTrendsChart.vue';
import DashboardOrderStatusPieChart from '~/components/dashboard/DashboardOrderStatusPieChart.vue';
import { parseOrderMetrics } from '~/lib/dashboard-api';
import { toDashboardQueryParams } from '~/lib/dashboard-date';
import type { DashboardDateFilterValue } from '~/types/dashboard';

const props = defineProps<{
  filter: DashboardDateFilterValue;
}>();

const query = computed(() => toDashboardQueryParams(props.filter));

const { data, pending, error } = await useFetch<unknown>('/api/dashboard/order-metrics', {
  query,
  watch: [query],
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
    <p
      v-if="error"
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      Unable to load chart metrics for this period.
    </p>

    <div :key="chartKey" class="grid grid-cols-1 items-start gap-4 min-[1000px]:grid-cols-2">
      <DashboardOrderTrendsChart
        :points="trendPoints"
        :filter-type="filter.filterType"
        :pending="pending"
      />
      <DashboardOrderStatusPieChart :slices="statusSlices" :pending="pending" />
    </div>
  </section>
</template>
