import { parseActivityLogListResponse } from '~/lib/activity-log-api';
import type {
  ActivityLogListFilters,
  AdminActivityLogItem,
} from '~/types/activity-log';

const ACTIVITY_INFINITE_PAGE_SIZE = 30;

/**
 * Infinite-scroll loader for the activity log (mirrors useInfiniteOrders).
 * `buildApiQuery` lets each page scope results (e.g. the inventory page limits
 * to inventory modules) while sharing the load-more machinery.
 */
export function useInfiniteActivityLog(
  filters: Ref<ActivityLogListFilters>,
  buildApiQuery: (f: ActivityLogListFilters) => Record<string, unknown>,
) {
  const rows = ref<AdminActivityLogItem[]>([]);
  const total = ref(0);
  const currentPage = ref(0);
  const hasMore = ref(true);
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);

  // Query without page/limit — used both as the fetch base and the reset key.
  const baseQuery = computed(() => {
    const query = { ...buildApiQuery(filters.value) } as Record<string, unknown>;
    delete query.page;
    delete query.limit;
    return query;
  });
  const filterKey = computed(() => JSON.stringify(baseQuery.value));

  function mergeRows(
    existing: AdminActivityLogItem[],
    incoming: AdminActivityLogItem[],
  ) {
    const seen = new Set(existing.map((row) => row.id));
    const merged = [...existing];
    for (const row of incoming) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        merged.push(row);
      }
    }
    return merged;
  }

  async function fetchPage(page: number, append: boolean) {
    const query = {
      ...baseQuery.value,
      page,
      limit: ACTIVITY_INFINITE_PAGE_SIZE,
    };
    const payload = await $fetch<unknown>('/api/activity', { query });
    const parsed = parseActivityLogListResponse(
      payload,
      page,
      ACTIVITY_INFINITE_PAGE_SIZE,
    );

    rows.value = append ? mergeRows(rows.value, parsed.rows) : parsed.rows;
    total.value = parsed.meta.total;
    hasMore.value =
      parsed.meta.hasNext ?? parsed.rows.length === ACTIVITY_INFINITE_PAGE_SIZE;
    currentPage.value = page;
  }

  async function loadInitial() {
    loading.value = true;
    error.value = null;
    try {
      await fetchPage(1, false);
    } catch (cause) {
      rows.value = [];
      total.value = 0;
      hasMore.value = false;
      currentPage.value = 0;
      error.value =
        cause instanceof Error ? cause : new Error('Unable to load activity log');
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value || currentPage.value < 1) {
      return;
    }
    loadingMore.value = true;
    try {
      await fetchPage(currentPage.value + 1, true);
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause : new Error('Unable to load more activity');
    } finally {
      loadingMore.value = false;
    }
  }

  async function refresh() {
    await loadInitial();
  }

  watch(
    filterKey,
    () => {
      rows.value = [];
      total.value = 0;
      hasMore.value = true;
      currentPage.value = 0;
      void loadInitial();
    },
    { immediate: true },
  );

  return { rows, total, hasMore, loading, loadingMore, error, loadMore, refresh };
}
