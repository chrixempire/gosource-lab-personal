<script setup lang="ts">
import { SegmentedControl } from '@gosource/ui';
import type { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import { ensureDashboardChartsRegistered } from '~/lib/dashboard-charts';
import {
  formatDashboardCurrency,
  formatDashboardNumber,
} from '~/lib/dashboard-date';
import {
  type DashboardTrendMetric,
  formatTrendTooltipTitle,
  getTrendChartScrollMinWidth,
  isHourlyTrendFilter,
  showsEveryTrendAxisLabel,
  trendMetricValue,
} from '~/lib/dashboard-trends';
import type { DashboardDateFilterType, DashboardTrendPoint } from '~/types/dashboard';
import LoadingState from '~/components/shared/LoadingState.vue';
import EmptyState from '~/components/shared/EmptyState.vue';

const props = defineProps<{
  points: DashboardTrendPoint[];
  filterType: DashboardDateFilterType;
  pending?: boolean;
}>();

const isHourlyView = computed(() => isHourlyTrendFilter(props.filterType));
const showEveryAxisLabel = computed(() => showsEveryTrendAxisLabel(props.filterType));
const chartScrollMinWidth = computed(() =>
  getTrendChartScrollMinWidth(props.filterType, props.points.length),
);

const metric = ref<DashboardTrendMetric>('count');
const metricOptions = [
  { label: 'Order amount', value: 'count' },
  { label: 'Order value', value: 'value' },
] as const;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartContainerRef = ref<HTMLElement | null>(null);
let chart: Chart | null = null;
let resizeObserver: ResizeObserver | null = null;

const chartConfig = computed((): ChartConfiguration<'bar'> => {
  const labels = props.points.map((point) => point.label);
  const values = props.points.map((point) => trendMetricValue(point, metric.value));
  const isValue = metric.value === 'value';

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: isValue ? 'Order value' : 'Order amount',
          data: values,
          backgroundColor: '#1F4031',
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 280 },
      layout: {
        padding: {
          bottom: isHourlyView.value ? 4 : 0,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) {
              const index = items[0]?.dataIndex;
              if (index == null) {
                return '';
              }

              const point = props.points[index];
              return point ? formatTrendTooltipTitle(props.filterType, point) : '';
            },
            label(context) {
              const value = context.parsed.y ?? 0;
              return isValue
                ? `Order value: ${formatDashboardCurrency(value)}`
                : `Orders: ${formatDashboardNumber(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: isHourlyView.value ? 55 : 0,
            minRotation: isHourlyView.value ? 55 : 0,
            autoSkip: !showEveryAxisLabel.value,
            maxTicksLimit: showEveryAxisLabel.value
              ? props.points.length
              : props.points.length > 20
                ? 10
                : 12,
            font: { size: isHourlyView.value ? 8 : showEveryAxisLabel.value ? 9 : 10 },
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: isValue ? 'Value (NGN)' : 'Orders',
            font: { size: 10 },
          },
          ticks: {
            font: { size: 10 },
            callback: (value) =>
              isValue
                ? formatDashboardNumber(Number(value))
                : formatDashboardNumber(Number(value)),
          },
        },
      },
    },
  };
});

function destroyChart() {
  chart?.destroy();
  chart = null;
}

function renderChart() {
  if (!import.meta.client || !canvasRef.value || !props.points.length || props.pending) {
    return;
  }

  ensureDashboardChartsRegistered();

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

function scheduleChartRender() {
  if (!import.meta.client) {
    return;
  }

  nextTick(() => {
    requestAnimationFrame(() => {
      if (props.pending) {
        return;
      }

      if (!props.points.length) {
        destroyChart();
        return;
      }

      renderChart();
    });
  });
}

function bindResizeObserver() {
  resizeObserver?.disconnect();
  resizeObserver = null;

  const container = chartContainerRef.value;
  if (!container) {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    if (!props.pending && props.points.length) {
      scheduleChartRender();
    }
  });
  resizeObserver.observe(container);
}

watch(
  () => [props.points, props.pending, metric.value, props.filterType] as const,
  () => {
    scheduleChartRender();
  },
  { deep: true, flush: 'post' },
);

watch([canvasRef, chartContainerRef], ([canvas, container]) => {
  if (container) {
    bindResizeObserver();
  }

  if (canvas) {
    scheduleChartRender();
  }
});

onMounted(() => {
  bindResizeObserver();
  scheduleChartRender();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  destroyChart();
});
</script>

<template>
  <article class="flex w-full min-w-0 flex-col rounded-2xl border border-grey-50 bg-white p-4 shadow-sm">
    <header
      class="mb-2 flex shrink-0 flex-col gap-2 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between"
    >
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-grey-900">Orders over time</h3>
        <p class="text-xs text-grey-300">
          {{
            metric === 'value'
              ? 'Total order value for the selected period.'
              : 'Number of orders for the selected period.'
          }}
        </p>
      </div>
      <SegmentedControl
        v-model="metric"
        :options="[...metricOptions]"
        class="w-full min-[1000px]:w-auto"
      />
    </header>

    <div v-if="pending" class="flex h-[300px] items-center justify-center">
      <LoadingState label="Loading chart…" />
    </div>
    <div
      v-else-if="!points.length"
      class="flex h-[300px] items-center justify-center"
    >
      <EmptyState
        class="flex h-full w-full flex-col justify-center"
        title="No chart data"
        description="Choose a date range to load order trends."
      />
    </div>
    <div
      v-else
      ref="chartContainerRef"
      class="relative h-[300px] w-full overflow-x-auto overscroll-x-contain"
    >
      <div
        class="h-full"
        :style="chartScrollMinWidth ? { minWidth: chartScrollMinWidth } : undefined"
      >
        <canvas ref="canvasRef" class="block h-full w-full" />
      </div>
    </div>
  </article>
</template>
