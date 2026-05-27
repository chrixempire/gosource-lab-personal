import type { OrderRecord } from '@gosource/api-client';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import {
  readCachedExploreLastOrder,
  writeCachedExploreLastOrder,
} from '~/services/explore-cache.service';
import { useCustomerOrderService } from '~/services/order.service';

const EXPLORE_REVALIDATE_COOLDOWN_MS = 15000;

function pickLatestOrderWithProducts(orders: OrderRecord[]): OrderRecord | null {
  const candidates = orders.filter((order) => (order.products?.length ?? 0) > 0);

  return (
    candidates.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0] ?? null
  );
}

export function useExploreLastOrder() {
  const { activeBranchId, hasSession } = useBusinessBranchContext();
  const { listOrders } = useCustomerOrderService();

  const lastOrder = useState<OrderRecord | null>('explore-last-order-value', () => null);
  const loading = useState('explore-last-order-loading', () => false);
  const loaded = useState('explore-last-order-loaded', () => false);
  const lastFetchedAt = useState<Record<string, number>>('explore-last-order-last-fetched', () => ({}));
  const memoryCache = useState<Record<string, { order: OrderRecord; fetchedAt: number }>>(
    'explore-last-order-cache',
    () => ({}),
  );
  function hydrateFromCache(branchId: string) {
    const memory = memoryCache.value[branchId];
    if (memory?.order) {
      lastOrder.value = memory.order;
      loaded.value = true;
      return;
    }

    const stored = readCachedExploreLastOrder(branchId, { allowStale: true });
    if (stored) {
      lastOrder.value = stored;
      memoryCache.value[branchId] = { order: stored, fetchedAt: Date.now() };
      loaded.value = true;
    }
  }

  function persistOrder(branchId: string, order: OrderRecord | null) {
    if (!order) {
      return;
    }

    lastOrder.value = order;
    memoryCache.value[branchId] = { order, fetchedAt: Date.now() };
    writeCachedExploreLastOrder(branchId, order);
  }

  async function refresh(options: { force?: boolean } = {}) {
    if (!import.meta.client || !hasSession.value) {
      lastOrder.value = null;
      loaded.value = false;
      return;
    }

    const branchId = activeBranchId.value;
    if (!branchId) {
      lastOrder.value = null;
      loaded.value = false;
      return;
    }

    hydrateFromCache(branchId);

    const lastFetch = lastFetchedAt.value[branchId] ?? 0;
    if (!options.force && Date.now() - lastFetch < EXPLORE_REVALIDATE_COOLDOWN_MS) {
      return;
    }

    if (!lastOrder.value) {
      loading.value = true;
    }

    try {
      lastFetchedAt.value[branchId] = Date.now();
      const response = await listOrders({
        page: 1,
        limit: 10,
        branchId,
      });

      const next = pickLatestOrderWithProducts(response.data ?? []);
      lastOrder.value = next;

      if (next) {
        persistOrder(branchId, next);
      }
    } catch {
      if (!lastOrder.value) {
        lastOrder.value = null;
      }
    } finally {
      loading.value = false;
      loaded.value = true;
    }
  }

  if (import.meta.client) {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && hasSession.value && activeBranchId.value) {
        void refresh({ force: true });
      }
    };

    const onWindowFocus = () => {
      if (hasSession.value && activeBranchId.value) {
        void refresh({ force: true });
      }
    };

    watch([hasSession, activeBranchId], ([sessionOk, branchId]) => {
      if (!sessionOk || !branchId) {
        lastOrder.value = null;
        loaded.value = false;
        loading.value = false;
        return;
      }

      hydrateFromCache(branchId);
      void refresh({ force: true });
    }, { immediate: true });

    onMounted(() => {
      window.addEventListener('pageshow', onPageShow);
      window.addEventListener('focus', onWindowFocus);
    });

    onUnmounted(() => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onWindowFocus);
    });
  }

  const showSkeleton = computed(() => {
    if (lastOrder.value) {
      return false;
    }

    return loading.value || !loaded.value;
  });

  return {
    lastOrder,
    loading,
    loaded,
    showSkeleton,
    refresh,
  };
}
