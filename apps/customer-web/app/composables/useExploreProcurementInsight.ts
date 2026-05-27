import {
  buildProcurementInsight,
  currentMonthQueryRange,
  fetchProcurementInsightForBranch,
  formatProcurementPeriodLabel,
  type ExploreProcurementInsightData,
} from '~/lib/explore-procurement-insight';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import {
  currentExploreMonthCacheKey,
  readCachedExploreProcurement,
  writeCachedExploreProcurement,
} from '~/services/explore-cache.service';
import { useCustomerAnalyticsService } from '~/services/analytics.service';
import { useCustomerOrderService } from '~/services/order.service';

const EMPTY_INSIGHT: ExploreProcurementInsightData = {
  rows: [],
  totalSpent: 0,
  periodLabel: formatProcurementPeriodLabel(),
};
const EXPLORE_REVALIDATE_COOLDOWN_MS = 15000;

export function useExploreProcurementInsight() {
  const { activeBranchId, hasSession } = useBusinessBranchContext();
  const { listOrders } = useCustomerOrderService();
  const { getTotalProcurement, getTopProcuredItems, getProductAnalysis } =
    useCustomerAnalyticsService();

  const insight = useState<ExploreProcurementInsightData>(
    'explore-procurement-value',
    () => ({ ...EMPTY_INSIGHT }),
  );
  const loading = useState('explore-procurement-loading', () => false);
  const loaded = useState('explore-procurement-loaded', () => false);
  const lastFetchedAt = useState<Record<string, number>>(
    'explore-procurement-last-fetched',
    () => ({}),
  );
  const memoryCache = useState<
    Record<string, { insight: ExploreProcurementInsightData; fetchedAt: number }>
  >('explore-procurement-cache', () => ({}));
  function cacheKey(branchId: string) {
    return `${branchId}:${currentExploreMonthCacheKey()}`;
  }

  function hydrateFromCache(branchId: string) {
    const key = cacheKey(branchId);
    const memory = memoryCache.value[key];
    if (memory?.insight.rows.length) {
      insight.value = memory.insight;
      loaded.value = true;
      return;
    }

    const monthKey = currentExploreMonthCacheKey();
    const stored = readCachedExploreProcurement(branchId, monthKey, { allowStale: true });
    if (stored?.rows.length) {
      insight.value = stored;
      memoryCache.value[key] = { insight: stored, fetchedAt: Date.now() };
      loaded.value = true;
    }
  }

  function persistInsight(branchId: string, next: ExploreProcurementInsightData) {
    const key = cacheKey(branchId);
    insight.value = next;
    if (next.rows.length > 0) {
      memoryCache.value[key] = { insight: next, fetchedAt: Date.now() };
      writeCachedExploreProcurement(branchId, currentExploreMonthCacheKey(), next);
    } else {
      delete memoryCache.value[key];
    }
  }

  async function fetchInsight(branchId: string): Promise<ExploreProcurementInsightData> {
    const periodLabel = formatProcurementPeriodLabel();
    const range = currentMonthQueryRange();
    const { items, totalSpent } = await fetchProcurementInsightForBranch(
      { listOrders, getTotalProcurement, getTopProcuredItems, getProductAnalysis },
      branchId,
      range,
    );

    if (items.length === 0) {
      return { ...EMPTY_INSIGHT, periodLabel };
    }

    return buildProcurementInsight(items, totalSpent, periodLabel);
  }

  async function refresh(options: { force?: boolean } = {}) {
    if (!import.meta.client || !hasSession.value) {
      insight.value = { ...EMPTY_INSIGHT };
      loaded.value = false;
      return;
    }

    const branchId = activeBranchId.value;
    if (!branchId) {
      insight.value = { ...EMPTY_INSIGHT };
      loaded.value = false;
      return;
    }

    hydrateFromCache(branchId);

    const key = cacheKey(branchId);
    const lastFetch = lastFetchedAt.value[key] ?? 0;
    if (!options.force && Date.now() - lastFetch < EXPLORE_REVALIDATE_COOLDOWN_MS) {
      return;
    }

    if (!insight.value.rows.length) {
      loading.value = true;
    }

    try {
      lastFetchedAt.value[key] = Date.now();
      const next = await fetchInsight(branchId);
      persistInsight(branchId, next);
      if (next.rows.length === 0) {
        insight.value = next;
      }
    } catch {
      if (!insight.value.rows.length) {
        insight.value = { ...EMPTY_INSIGHT, periodLabel: formatProcurementPeriodLabel() };
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
        insight.value = { ...EMPTY_INSIGHT };
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

  const hasData = computed(() => insight.value.rows.length > 0);
  const showSkeleton = computed(() => {
    if (hasData.value) {
      return false;
    }

    return loading.value || !loaded.value;
  });

  return {
    insight,
    rows: computed(() => insight.value.rows),
    totalSpent: computed(() => insight.value.totalSpent),
    periodLabel: computed(() => insight.value.periodLabel),
    hasData,
    loading,
    loaded,
    showSkeleton,
    refresh,
  };
}
