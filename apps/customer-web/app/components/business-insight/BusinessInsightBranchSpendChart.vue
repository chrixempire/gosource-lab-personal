<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import type { ChartConfiguration } from 'chart.js';
import { Chart } from 'chart.js';
import type { BranchSpendRow } from '~/lib/business-insight-metrics';
import { useCustomerChartCanvas } from '~/composables/useCustomerChartCanvas';
import {
  customerChartTooltipPlugin,
  ensureCustomerChartsRegistered,
  readCustomerChartTheme,
} from '~/lib/customer-charts';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useCustomerTheme } from '~/composables/useCustomerTheme';
import BusinessInsightChartSkeleton from '~/components/business-insight/BusinessInsightChartSkeleton.vue';

type BranchChartType = 'line' | 'bar';

const CHART_TYPE_OPTIONS: Array<{ label: string; value: BranchChartType }> = [
  { label: 'Line chart', value: 'line' },
  { label: 'Bar chart', value: 'bar' },
];

const props = defineProps<{
  rows: BranchSpendRow[];
  pending?: boolean;
}>();

const chartType = ref<BranchChartType>('line');

const selectedChartLabel = computed(
  () => CHART_TYPE_OPTIONS.find((option) => option.value === chartType.value)?.label ?? 'Line chart',
);

const { resolved } = useCustomerTheme();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartContainerRef = ref<HTMLElement | null>(null);
let chart: Chart | null = null;

const hasBranches = computed(() => props.rows.length > 0);
const hasSpend = computed(() => props.rows.some((row) => row.totalSpend > 0));
const showChart = computed(() => !props.pending && hasBranches.value);

function buildDataset(theme: ReturnType<typeof readCustomerChartTheme>, values: number[]) {
  if (chartType.value === 'bar') {
    return {
      label: 'Spend',
      data: values,
      backgroundColor: theme.primary,
      borderRadius: 6,
      maxBarThickness: 40,
    };
  }

  return {
    label: 'Spend',
    data: values,
    borderColor: theme.primary,
    backgroundColor: 'transparent',
    fill: false,
    tension: 0,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointBackgroundColor: theme.primary,
    pointBorderColor: theme.surface,
    pointBorderWidth: 2,
  };
}

function buildConfig(): ChartConfiguration<'bar' | 'line'> {
  const theme = readCustomerChartTheme();
  const labels = props.rows.map((row) => row.branchName);
  const values = props.rows.map((row) => row.totalSpend);
  const type = chartType.value;
  const isLine = type === 'line';

  return {
    type,
    data: {
      labels,
      datasets: [buildDataset(theme, values)],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: isLine
          ? { bottom: 4 }
          : {
              left: 8,
              right: 8,
              top: 8,
              bottom: 4,
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

              return props.rows[index]?.branchName ?? '';
            },
            label(context) {
              const index = context.dataIndex;
              const row = index == null ? undefined : props.rows[index];
              const spend = context.parsed.y ?? 0;
              const lines = [`Spend: ${formatNaira(spend)}`];
              if (row && row.orderCount > 0) {
                lines.push(`Orders: ${row.orderCount}`);
              }
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          offset: !isLine,
          grid: { display: false },
          ticks: {
            color: theme.text,
            maxRotation: isLine ? 0 : 45,
            minRotation: 0,
            autoSkip: props.rows.length > 8,
            font: { size: 10 },
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

function selectChartType(value: BranchChartType) {
  chartType.value = value;
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
  () => [props.rows, chartType.value, resolved.value] as const,
  () => {
    scheduleRender();
  },
  { deep: true },
);
</script>

<template>
  <div class="customer-surface-card w-full rounded-[16px] p-4">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-start sm:justify-between"
    >
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-semibold text-grey-900">Spend by branch</h3>
        <p class="mt-1 text-xs text-grey-300">
          All branches for your business; bars and lines rise with spend in this period
        </p>
      </div>

      <DropdownMenu v-if="showChart || pending" class="shrink-0 self-start sm:self-auto">
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="small"
            class="!w-fit shrink-0 whitespace-nowrap border-grey-50 bg-background-on-canvas text-grey-900"
            :right-icon="ChevronDown"
          >
            {{ selectedChartLabel }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-[10rem]">
          <DropdownMenuItem
            v-for="option in CHART_TYPE_OPTIONS"
            :key="option.value"
            class="justify-between gap-3"
            @select="selectChartType(option.value)"
          >
            {{ option.label }}
            <Check v-if="chartType === option.value" class="size-4 text-primary-500" aria-hidden="true" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <BusinessInsightChartSkeleton v-if="pending" />

    <div
      v-else-if="!hasBranches"
      class="mt-4 flex h-[260px] items-center justify-center rounded-[12px] border border-dashed border-grey-50 text-sm text-grey-300"
    >
      No branches found for this business
    </div>

    <div v-else ref="chartContainerRef" class="relative mt-4 h-[260px] w-full">
      <canvas ref="canvasRef" class="size-full" />
      <p
        v-if="!hasSpend"
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-grey-300"
      >
        No branch spend in this period
      </p>
    </div>
  </div>
</template>
