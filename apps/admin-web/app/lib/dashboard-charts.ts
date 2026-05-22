import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

let registered = false;

export function ensureDashboardChartsRegistered() {
  if (registered) {
    return;
  }

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarController,
    BarElement,
    DoughnutController,
    ArcElement,
    Tooltip,
    Legend,
  );
  registered = true;
}
