import { orderListFiltersToApiQuery } from '~/lib/order-filters';
import { ORDER_INFINITE_PAGE_SIZE, orderListFilterKey } from '~/lib/order-list';
import { parseFilteredOrdersResponse } from '~/lib/order-api';
import type { AdminOrderListItem, OrderListFilters } from '~/types/orders';

export function useInfiniteOrders(filters: Ref<OrderListFilters>) {
  const orders = ref<AdminOrderListItem[]>([]);
  const total = ref(0);
  const currentPage = ref(0);
  const hasMore = ref(true);
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);

  const filterKey = computed(() => orderListFilterKey(filters.value));

  function mergeRows(existing: AdminOrderListItem[], incoming: AdminOrderListItem[]) {
    const seen = new Set(existing.map((order) => order.id));
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
      ...orderListFiltersToApiQuery(filters.value),
      page,
      limit: ORDER_INFINITE_PAGE_SIZE,
    };

    const payload = await $fetch<unknown>('/api/orders/filtered', { query });
    const parsed = parseFilteredOrdersResponse(payload, page, ORDER_INFINITE_PAGE_SIZE);

    orders.value = append ? mergeRows(orders.value, parsed.rows) : parsed.rows;
    total.value = parsed.meta.total;
    hasMore.value = parsed.meta.hasNext;
    currentPage.value = page;

    return parsed;
  }

  async function loadInitial() {
    loading.value = true;
    error.value = null;

    try {
      await fetchPage(1, false);
    } catch (cause) {
      orders.value = [];
      total.value = 0;
      hasMore.value = false;
      currentPage.value = 0;
      error.value = cause instanceof Error ? cause : new Error('Unable to load orders');
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
      error.value = cause instanceof Error ? cause : new Error('Unable to load more orders');
    } finally {
      loadingMore.value = false;
    }
  }

  async function refresh() {
    await loadInitial();
  }

  function patchOrder(orderId: string, patch: Partial<AdminOrderListItem>) {
    const index = orders.value.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return;
    }

    const current = orders.value[index];
    if (!current) return;
    orders.value[index] = {
      ...current,
      ...patch,
    };
  }

  watch(
    filterKey,
    () => {
      loading.value = true;
      error.value = null;
      orders.value = [];
      total.value = 0;
      hasMore.value = true;
      currentPage.value = 0;
      void loadInitial();
    },
    { immediate: true },
  );

  return {
    orders,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
    patchOrder,
  };
}
