import type { ChartData } from 'chart.js';
import { unwrapLegacyPayload } from '~/lib/dashboard-api';

export type CreditAnalyticsChartsData = {
  creditUsage: {
    labels: string[];
    valuesNaira: number[];
    year: number;
  };
  repaymentPerformance: {
    paidEarly: number;
    paidOnTime: number;
    defaulted: number;
    late: number;
  };
};

const EMPTY_CHARTS: CreditAnalyticsChartsData = {
  creditUsage: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    valuesNaira: Array.from({ length: 12 }, () => 0),
    year: new Date().getFullYear(),
  },
  repaymentPerformance: {
    paidEarly: 0,
    paidOnTime: 0,
    defaulted: 0,
    late: 0,
  },
};

export function parseCreditAnalyticsCharts(payload: unknown): CreditAnalyticsChartsData {
  const body = unwrapLegacyPayload(payload);
  const creditUsage = body?.creditUsage;
  const repaymentPerformance = body?.repaymentPerformance;

  if (!creditUsage || typeof creditUsage !== 'object' || !repaymentPerformance) {
    return EMPTY_CHARTS;
  }

  const usage = creditUsage as Record<string, unknown>;
  const performance = repaymentPerformance as Record<string, unknown>;
  const labels = Array.isArray(usage.labels)
    ? usage.labels.map((label) => String(label))
    : EMPTY_CHARTS.creditUsage.labels;
  const valuesNaira = Array.isArray(usage.valuesNaira)
    ? usage.valuesNaira.map((value) => Number(value) || 0)
    : EMPTY_CHARTS.creditUsage.valuesNaira;

  return {
    creditUsage: {
      labels,
      valuesNaira,
      year: Number(usage.year) || new Date().getFullYear(),
    },
    repaymentPerformance: {
      paidEarly: Number(performance.paidEarly) || 0,
      paidOnTime: Number(performance.paidOnTime) || 0,
      defaulted: Number(performance.defaulted) || 0,
      late: Number(performance.late) || 0,
    },
  };
}

export function hasCreditUsageChartData(data: CreditAnalyticsChartsData) {
  return data.creditUsage.valuesNaira.some((value) => value > 0);
}

export function hasRepaymentPerformanceChartData(data: CreditAnalyticsChartsData) {
  const { paidEarly, paidOnTime, defaulted, late } = data.repaymentPerformance;
  return paidEarly + paidOnTime + defaulted + late > 0;
}

export function buildCreditUsageLineData(data: CreditAnalyticsChartsData): ChartData<'line'> {
  return {
    labels: data.creditUsage.labels,
    datasets: [
      {
        label: 'Credit disbursed',
        data: data.creditUsage.valuesNaira,
        borderColor: '#DD900D',
        backgroundColor: '#DD900D',
        tension: 0.1,
      },
    ],
  };
}

export function buildRepaymentPerformancePieData(
  data: CreditAnalyticsChartsData,
): ChartData<'pie'> {
  const { paidEarly, paidOnTime, defaulted, late } = data.repaymentPerformance;

  return {
    labels: ['Paid early', 'Paid on time', 'Defaulted', 'Late'],
    datasets: [
      {
        label: 'Repayments',
        data: [paidEarly, paidOnTime, defaulted, late],
        backgroundColor: ['#DAF1E2', '#19B820', '#DD900D', '#09420C'],
      },
    ],
  };
}
