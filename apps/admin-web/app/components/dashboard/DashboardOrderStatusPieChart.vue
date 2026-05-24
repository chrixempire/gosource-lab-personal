<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import { ensureDashboardChartsRegistered } from '~/lib/dashboard-charts';
import {
  DASHBOARD_PIE_OTHER_STATUSES_HINT,
  DASHBOARD_STATUS_COLORS,
  formatDashboardPieStatusLabel,
} from '~/lib/dashboard-date';
import type { DashboardStatusSlice } from '~/types/dashboard';
import LoadingState from '~/components/shared/LoadingState.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import { useDashboardChartCanvas } from '~/composables/useDashboardChartCanvas';

const props = defineProps<{
  slices: DashboardStatusSlice[];
  pending?: boolean;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartContainerRef = ref<HTMLElement | null>(null);
let chart: Chart | null = null;

const visibleSlices = computed(() => props.slices.filter((slice) => slice.count > 0));
const hasChartData = computed(() => visibleSlices.value.length > 0);

function formatPieLegendLabel(slice: DashboardStatusSlice) {
  return `${formatDashboardPieStatusLabel(slice.status)} (${slice.percentage}%)`;
}

const chartConfig = computed((): ChartConfiguration<'doughnut'> => ({
  type: 'doughnut',
  data: {
    labels: visibleSlices.value.map((slice) => formatPieLegendLabel(slice)),
    datasets: [
      {
        data: visibleSlices.value.map((slice) => slice.percentage),
        backgroundColor: visibleSlices.value.map(
          (slice) => DASHBOARD_STATUS_COLORS[slice.status] ?? DASHBOARD_STATUS_COLORS.other,
        ),
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          padding: 8,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label(context) {
            const slice = visibleSlices.value[context.dataIndex];
            if (!slice) {
              return '';
            }

            const lines = [
              `${formatDashboardPieStatusLabel(slice.status)}: ${slice.percentage}% (${slice.count} orders)`,
            ];

            if (slice.status === 'other') {
              lines.push(DASHBOARD_PIE_OTHER_STATUSES_HINT);
            }

            return lines;
          },
        },
      },
    },
  },
}));

function destroyChart() {
  chart?.destroy();
  chart = null;
}

function renderChart() {
  if (!import.meta.client || !canvasRef.value || !hasChartData.value || props.pending) {
    return;
  }

  ensureDashboardChartsRegistered();

  if (chart && chart.canvas !== canvasRef.value) {
    destroyChart();
  }

  if (chart) {
    chart.data = chartConfig.value.data!;
    chart.options = chartConfig.value.options!;
    chart.update();
    chart.resize();
    return;
  }

  chart = new Chart(canvasRef.value, chartConfig.value);
  chart.resize();
}

const { scheduleRender } = useDashboardChartCanvas({
  pending: toRef(props, 'pending'),
  hasData: hasChartData,
  canvasRef,
  chartContainerRef,
  render: renderChart,
  destroy: destroyChart,
});

watch(
  () => props.slices,
  () => {
    scheduleRender();
  },
  { deep: true, flush: 'post' },
);
</script>

<template>
  <article class="flex w-full min-w-0 flex-col rounded-2xl border border-grey-50 bg-white p-4 shadow-sm">
    <header class="mb-2 shrink-0">
      <h3 class="text-sm font-semibold text-grey-900">Order status</h3>
      <p class="text-xs text-grey-300">Share of orders by status for the selected period.</p>
    </header>

    <div v-if="pending" class="flex h-[300px] items-center justify-center">
      <LoadingState label="Loading chart…" />
    </div>
    <div
      v-else-if="!hasChartData"
      class="flex h-[300px] items-center justify-center"
    >
      <EmptyState
        class="flex h-full w-full flex-col justify-center"
        title="No status data"
        description="There are no orders in this period to chart."
      />
    </div>
    <div v-else ref="chartContainerRef" class="relative h-[300px] w-full min-w-0 overflow-hidden">
      <canvas ref="canvasRef" class="block h-full w-full" />
    </div>
  </article>
</template>
