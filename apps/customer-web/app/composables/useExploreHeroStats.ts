import {
  buildWalkInPriceByProductId,
  computeWalkInSavingsFromOrders,
  flattenCatalogProducts,
} from '~/lib/explore-hero-stats';
import { fetchBranchOrdersInRange } from '~/lib/explore-branch-orders';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import { useCustomerOrderService } from '~/services/order.service';

export function useExploreHeroStats() {
  const { activeBranchId, hasSession } = useBusinessBranchContext();
  const { catalogList } = useMarketCatalog();
  const { listOrders } = useCustomerOrderService();

  const ordersThisMonth = ref(0);
  const walkInSavingsNaira = ref(0);
  const loading = ref(false);
  const loaded = ref(false);

  async function refresh() {
    if (!import.meta.client || !hasSession.value) {
      ordersThisMonth.value = 0;
      walkInSavingsNaira.value = 0;
      loaded.value = false;
      return;
    }

    const branchId = activeBranchId.value;
    if (!branchId) {
      ordersThisMonth.value = 0;
      walkInSavingsNaira.value = 0;
      loaded.value = false;
      return;
    }

    loading.value = true;

    try {
      const walkInPriceByProductId = buildWalkInPriceByProductId(
        flattenCatalogProducts(catalogList()),
      );
      const { orders, ordersTotal } = await fetchBranchOrdersInRange(listOrders, branchId);

      ordersThisMonth.value = ordersTotal;
      walkInSavingsNaira.value = computeWalkInSavingsFromOrders(orders, walkInPriceByProductId);
    } catch {
      ordersThisMonth.value = 0;
      walkInSavingsNaira.value = 0;
    } finally {
      loading.value = false;
      loaded.value = true;
    }
  }

  const catalogWalkInSignature = computed(() =>
    flattenCatalogProducts(catalogList())
      .filter((product) => product.compareAtNaira && product.compareAtNaira > product.priceNaira)
      .map((product) => `${product.id}:${product.compareAtNaira}`)
      .join('|'),
  );

  if (import.meta.client) {
    watch([hasSession, activeBranchId], () => {
      void refresh();
    }, { immediate: true });

    watch(catalogWalkInSignature, () => {
      if (loaded.value) {
        void refresh();
      }
    });
  }

  const ordersLabel = computed(() => {
    const count = ordersThisMonth.value;
    return `${count} order${count === 1 ? '' : 's'}`;
  });

  return {
    ordersThisMonth,
    walkInSavingsNaira,
    ordersLabel,
    loading,
    loaded,
    refresh,
  };
}
