import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js';

let registered = false;

/** Registers Chart.js controllers/elements used by dashboard and credit analytics charts. */
export function ensureDashboardChartsRegistered() {
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
    DoughnutController,
    PieController,
    ArcElement,
    Tooltip,
    Legend,
  );
  registered = true;
}
