import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

let registered = false;

export function ensureCustomerChartsRegistered() {
  if (registered) {
    return;
  }

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    Filler,
    Tooltip,
    Legend,
  );
  registered = true;
}

/** Read theme tokens from document for Chart.js (light/dark). */
export function readCustomerChartTheme() {
  if (!import.meta.client) {
    return {
      text: '#667085',
      grid: '#e4e7ec',
      primary: '#19b820',
      primarySoft: 'rgba(25, 184, 32, 0.15)',
      surface: '#ffffff',
    };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    text: read('--grey-text', '#667085'),
    grid: read('--grey-50', '#e4e7ec'),
    primary: read('--primary-500', '#19b820'),
    primarySoft: read('--primary-50', 'rgba(25, 184, 32, 0.2)'),
    surface: read('--background-on-canvas', '#ffffff'),
    tooltipBg: read('--background-on-canvas', '#ffffff'),
    tooltipTitle: read('--grey-900', '#101928'),
    tooltipBody: read('--grey-text', '#667085'),
  };
}

export function customerChartTooltipPlugin(theme: ReturnType<typeof readCustomerChartTheme>) {
  return {
    enabled: true,
    backgroundColor: theme.tooltipBg,
    titleColor: theme.tooltipTitle,
    bodyColor: theme.tooltipBody,
    borderColor: theme.grid,
    borderWidth: 1,
    padding: 10,
    displayColors: false,
    cornerRadius: 8,
    titleFont: { size: 12, weight: 600 },
    bodyFont: { size: 12 },
  };
}
