import { currentMonthQueryRange } from '~/lib/explore-procurement-insight';

type AnalyticsEnvelope<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

export function useCustomerAnalyticsService() {
  async function getTotalProcurement(
    branchId: string,
    options: { startDate: string; endDate: string; quiet?: boolean } = currentMonthQueryRange(),
  ) {
    try {
      return await $fetch<AnalyticsEnvelope<unknown>>(
        `/api/proxy/analytics/total-procurement/branch/${encodeURIComponent(branchId)}`,
        {
          credentials: 'same-origin',
          query: {
            startDate: options.startDate,
            endDate: options.endDate,
          },
        },
      );
    } catch (error) {
      if (!options.quiet) {
        throw error;
      }
      return null;
    }
  }

  async function getTopProcuredItems(branchId: string, options: { quiet?: boolean } = {}) {
    try {
      return await $fetch<AnalyticsEnvelope<unknown>>(
        `/api/proxy/analytics/top-procured-items/branch/${encodeURIComponent(branchId)}`,
        {
          credentials: 'same-origin',
          query: { sortBy: 'totalCost' },
        },
      );
    } catch (error) {
      if (!options.quiet) {
        throw error;
      }
      return null;
    }
  }

  return {
    getTotalProcurement,
    getTopProcuredItems,
  };
}
