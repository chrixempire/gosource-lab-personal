import type { OrderRecord } from '@gosource/api-client';
import type { Ref } from 'vue';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import {
  buildProcurementInsight,
  currentMonthQueryRange,
  fetchProcurementInsightForBranch,
  formatProcurementPeriodLabel,
  type ExploreProcurementInsightData,
} from '~/lib/explore-procurement-insight';
import { pickLatestOrderWithProducts } from '~/lib/explore-last-order';
import { useCustomerAnalyticsService } from '~/services/analytics.service';
import { useCustomerOrderService } from '~/services/order.service';

const EMPTY_INSIGHT: ExploreProcurementInsightData = {
  rows: [],
  totalSpent: 0,
  periodLabel: formatProcurementPeriodLabel(),
};

/** Order again + monthly breakdown: branch filter only (current month, not page period filter). */
export function useBusinessInsightHero(branchId: Ref<string | undefined>) {
  const { listOrders } = useCustomerOrderService();
  const { getTotalProcurement, getTopProcuredItems, getProductAnalysis } =
    useCustomerAnalyticsService();
  const branchContext = useBusinessBranchContext();

  const lastOrder = ref<OrderRecord | null>(null);
  const insight = ref<ExploreProcurementInsightData>({ ...EMPTY_INSIGHT });
  const pending = ref(false);
  const loaded = ref(false);

  async function refresh() {
    const resolvedBranchId = branchId.value?.trim();

    if (!import.meta.client) {
      return;
    }

    if (!resolvedBranchId) {
      if (!branchContext.isReady.value || branchContext.branchFetchLoading.value) {
        pending.value = true;
        loaded.value = false;
        return;
      }

      lastOrder.value = null;
      insight.value = { ...EMPTY_INSIGHT };
      pending.value = false;
      loaded.value = true;
      return;
    }

    pending.value = true;

    try {
      const monthRange = currentMonthQueryRange();
      const [ordersResponse, procurement] = await Promise.all([
        listOrders({ branchId: resolvedBranchId, page: 1, limit: 20 }),
        fetchProcurementInsightForBranch(
          { listOrders, getTotalProcurement, getTopProcuredItems, getProductAnalysis },
          resolvedBranchId,
          monthRange,
        ),
      ]);

      lastOrder.value = pickLatestOrderWithProducts(ordersResponse.data ?? []);

      if (procurement.items.length === 0) {
        insight.value = { ...EMPTY_INSIGHT };
      } else {
        insight.value = buildProcurementInsight(
          procurement.items,
          procurement.totalSpent,
          formatProcurementPeriodLabel(),
        );
      }
    } catch {
      lastOrder.value = null;
      insight.value = { ...EMPTY_INSIGHT };
    } finally {
      pending.value = false;
      loaded.value = true;
    }
  }

  watch(
    [branchId, () => branchContext.isReady.value, () => branchContext.activeBranchId.value],
    () => {
      void refresh();
    },
    { immediate: true },
  );

  return {
    lastOrder,
    insight,
    pending,
    loaded,
    refresh,
  };
}
