<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import type { SpendTrendPoint } from '~/lib/business-insight-metrics';
import { useCustomerChartCanvas } from '~/composables/useCustomerChartCanvas';
import {
  customerChartTooltipPlugin,
  ensureCustomerChartsRegistered,
  readCustomerChartTheme,
} from '~/lib/customer-charts';
import {
  formatSpendTrendTooltipTitle,
  isHourlySpendTrendFilter,
  isMonthDaySpendTrendFilter,
  isWeekdaySpendTrendFilter,
  isYearMonthSpendTrendFilter,
  spendTrendHasActivity,
  showsEverySpendTrendAxisLabel,
} from '~/lib/business-insight-trends';
import type { InsightDateFilterType } from '~/lib/insight-date-filter';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useCustomerTheme } from '~/composables/useCustomerTheme';
import BusinessInsightChartSkeleton from '~/components/business-insight/BusinessInsightChartSkeleton.vue';

const props = defineProps<{
  points: SpendTrendPoint[];
  filterType: InsightDateFilterType;
  pending?: boolean;
}>();

const { resolved } = useCustomerTheme();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartContainerRef = ref<HTMLElement | null>(null);
let chart: Chart | null = null;

const isHourlyView = computed(() => isHourlySpendTrendFilter(props.filterType));
const showEveryAxisLabel = computed(() => showsEverySpendTrendAxisLabel(props.filterType));
const hasData = computed(() => spendTrendHasActivity(props.points));
const hasAxis = computed(() => props.points.length > 0);
const showChart = computed(() => !props.pending && hasAxis.value);

const trendSubtitle = computed(() => {
  if (isHourlyView.value) {
    return 'Hourly spend from 12:00 AM through 11:00 PM';
  }
  if (isMonthDaySpendTrendFilter(props.filterType)) {
    return 'Daily spend for each day of the month';
  }
  if (isWeekdaySpendTrendFilter(props.filterType)) {
    return 'Spend by day of the week';
  }
  if (isYearMonthSpendTrendFilter(props.filterType)) {
    return 'Monthly spend for the selected year';
  }
  return 'Spend for the selected period';
});

function buildConfig(): ChartConfiguration<'line'> {
  const theme = readCustomerChartTheme();

  return {
    type: 'line',
    data: {
      labels: props.points.map((point) => point.label),
      datasets: [
        {
          label: 'Spend',
          data: props.points.map((point) => point.totalSpend),
          borderColor: theme.primary,
          backgroundColor: theme.primarySoft,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: theme.primary,
          pointBorderColor: theme.surface,
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: isHourlyView.value ? 4 : 0,
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...customerChartTooltipPlugin(theme),
          callbacks: {
            title(items) {
              const index = items[0]?.dataIndex;
              if (index == null) {
                return '';
              }

              const point = props.points[index];
              return point ? formatSpendTrendTooltipTitle(props.filterType, point) : '';
            },
            label(context) {
              const index = context.dataIndex;
              const point = index == null ? undefined : props.points[index];
              const spend = context.parsed.y ?? 0;
              const lines = [`Spend: ${formatNaira(spend)}`];
              if (point && point.orderCount > 0) {
                lines.push(`Orders: ${point.orderCount}`);
              }
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.text,
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
          grid: { color: theme.grid },
          ticks: {
            color: theme.text,
            maxTicksLimit: 6,
            callback: (value) => formatNaira(Number(value)),
          },
        },
      },
    },
  };
}

function destroyChart() {
  chart?.destroy();
  chart = null;
}

function renderChart() {
  if (!canvasRef.value || !showChart.value) {
    destroyChart();
    return;
  }

  ensureCustomerChartsRegistered();
  destroyChart();
  chart = new Chart(canvasRef.value, buildConfig());
}

function resizeChart() {
  if (!canvasRef.value || !showChart.value) {
    return;
  }

  if (chart) {
    chart.resize();
    return;
  }

  renderChart();
}

const { scheduleRender } = useCustomerChartCanvas({
  pending: computed(() => props.pending),
  showChart,
  canvasRef,
  chartContainerRef,
  render: renderChart,
  resize: resizeChart,
  destroy: destroyChart,
});

watch(
  () => [props.points, props.filterType, resolved.value] as const,
  () => {
    scheduleRender();
  },
  { deep: true },
);
</script>

<template>
  <div class="customer-surface-card w-full rounded-[16px] p-4">
    <h3 class="text-sm font-semibold text-grey-900">Spending trend</h3>
    <p class="mt-1 text-xs text-grey-300">{{ trendSubtitle }}</p>

    <BusinessInsightChartSkeleton v-if="pending" />

    <div
      v-else-if="!hasAxis"
      class="mt-4 flex h-[260px] items-center justify-center rounded-[12px] border border-dashed border-grey-50 text-sm text-grey-300"
    >
      No spend in this period
    </div>

    <div v-else ref="chartContainerRef" class="relative mt-4 h-[260px] w-full">
      <canvas ref="canvasRef" class="size-full" />
      <p
        v-if="!hasData"
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-grey-300"
      >
        No spend in this period
      </p>
    </div>
  </div>
</template>
