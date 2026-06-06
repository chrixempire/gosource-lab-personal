import { buildCreditAnalyticsCharts } from '../../../utils/credit-analytics-charts';

export default defineEventHandler(async (event) => {
  const charts = await buildCreditAnalyticsCharts(event);
  return { data: charts };
});
