<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadingState from '~/components/shared/LoadingState.vue';
import { ensureDashboardChartsRegistered } from '~/lib/dashboard-charts';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import {
  buildCreditUsageLineData,
  buildRepaymentPerformancePieData,
  hasCreditUsageChartData,
  hasRepaymentPerformanceChartData,
  parseCreditAnalyticsCharts,
} from '~/lib/credit-analytics-charts';

const { data: chartsData, pending } = useFetch<unknown>('/api/credit/analytics/charts');
const charts = computed(() => parseCreditAnalyticsCharts(chartsData.value));

const lineCanvas = ref<HTMLCanvasElement | null>(null);
const pieCanvas = ref<HTMLCanvasElement | null>(null);
const lineContainerRef = ref<HTMLElement | null>(null);
const pieContainerRef = ref<HTMLElement | null>(null);
let lineChart: Chart | null = null;
let pieChart: Chart | null = null;

const hasLineData = computed(() => hasCreditUsageChartData(charts.value));
const hasPieData = computed(() => hasRepaymentPerformanceChartData(charts.value));

const lineConfig = computed(
  (): ChartConfiguration<'line'> => ({
    type: 'line',
    data: buildCreditUsageLineData(charts.value),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y ?? 0;
              return `Disbursed: ${formatDashboardCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: '#F2F4F7' },
          ticks: {
            callback: (value) => formatDashboardCurrency(Number(value)),
          },
        },
      },
    },
  }),
);

const pieConfig = computed(
  (): ChartConfiguration<'pie'> => ({
    type: 'pie',
    data: buildRepaymentPerformancePieData(charts.value),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  }),
);

function destroyLineChart() {
  lineChart?.destroy();
  lineChart = null;
}

function destroyPieChart() {
  pieChart?.destroy();
  pieChart = null;
}

function renderLineChart() {
  if (!import.meta.client || pending.value || !hasLineData.value || !lineCanvas.value) return;

  ensureDashboardChartsRegistered();

  if (lineChart) {
    lineChart.data = lineConfig.value.data!;
    lineChart.options = lineConfig.value.options!;
    lineChart.update();
    return;
  }

  lineChart = new Chart(lineCanvas.value, lineConfig.value);
}

function renderPieChart() {
  if (!import.meta.client || pending.value || !hasPieData.value || !pieCanvas.value) return;

  ensureDashboardChartsRegistered();

  if (pieChart) {
    pieChart.data = pieConfig.value.data!;
    pieChart.options = pieConfig.value.options!;
    pieChart.update();
    return;
  }

  pieChart = new Chart(pieCanvas.value, pieConfig.value);
}

watch(
  () => [charts.value, pending.value] as const,
  async () => {
    if (!import.meta.client) return;
    await nextTick();
    renderLineChart();
    renderPieChart();
  },
  { deep: true, flush: 'post' },
);

onBeforeUnmount(() => {
  destroyLineChart();
  destroyPieChart();
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4 lg:flex-row">
    <section class="flex-1 rounded-xl border border-grey-50 bg-white p-4 shadow-sm">
      <div class="mb-4">
        <p class="text-sm font-medium text-grey-900">Credit usage</p>
        <p class="text-xs text-grey-500">
          Monthly credit disbursed in {{ charts.creditUsage.year }} (NGN).
        </p>
      </div>

      <div v-if="pending" class="flex h-[300px] items-center justify-center">
        <LoadingState label="Loading chart…" />
      </div>
      <div v-else-if="!hasLineData" class="flex h-[300px] items-center justify-center">
        <EmptyState
          class="flex h-full w-full flex-col justify-center"
          title="No credit usage data"
          description="Approved credit requests will appear here by month."
        />
      </div>
      <div v-else ref="lineContainerRef" class="h-[300px]">
        <canvas ref="lineCanvas" class="block h-full w-full" />
      </div>
    </section>

    <section class="flex-1 rounded-xl border border-grey-50 bg-white p-4 shadow-sm">
      <div class="mb-4">
        <p class="text-sm font-medium text-grey-900">Repayment performance</p>
        <p class="text-xs text-grey-500">Installment outcomes from repayment schedules.</p>
      </div>

      <div v-if="pending" class="flex h-[300px] items-center justify-center">
        <LoadingState label="Loading chart…" />
      </div>
      <div v-else-if="!hasPieData" class="flex h-[300px] items-center justify-center">
        <EmptyState
          class="flex h-full w-full flex-col justify-center"
          title="No repayment data"
          description="Repayment schedules will appear here once installments are due or paid."
        />
      </div>
      <div v-else ref="pieContainerRef" class="mx-auto h-[300px] max-w-md">
        <canvas ref="pieCanvas" class="block h-full w-full" />
      </div>
    </section>
  </div>
</template>
