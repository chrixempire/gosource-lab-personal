import {
  DEFAULT_PURCHASE_ORDER_LIST_FILTERS,
  parsePurchaseOrderListFiltersFromQuery,
  purchaseOrderListFiltersToRouteQuery,
} from '~/lib/purchase-order-filters';
import type { PurchaseOrderListFilters } from '~/types/purchase-orders';

export function usePurchaseOrderListFilters() {
  const route = useRoute();
  const router = useRouter();

  function buildPersistentQuery() {
    const query = route.query as Record<string, string | string[] | undefined | null>;
    const next: Record<string, string | string[]> = {};

    const view = query.view;
    if (typeof view === 'string' && view.length > 0) {
      next.view = view;
    }

    const sort = query.sort;
    if (typeof sort === 'string' && sort.length > 0) {
      next.sort = sort;
    }

    const direction = query.direction;
    if (typeof direction === 'string' && direction.length > 0) {
      next.direction = direction;
    }

    return next;
  }

  const filters = computed<PurchaseOrderListFilters>(() =>
    parsePurchaseOrderListFiltersFromQuery(
      route.query as Record<string, string | string[] | undefined | null>,
    ),
  );

  function replaceFilters(next: Partial<PurchaseOrderListFilters>) {
    const merged: PurchaseOrderListFilters = {
      ...filters.value,
      ...next,
    };

    router.replace({
      query: {
        ...buildPersistentQuery(),
        ...purchaseOrderListFiltersToRouteQuery(merged),
      },
    });
  }

  function resetFilters() {
    router.replace({
      query: {
        ...buildPersistentQuery(),
        ...purchaseOrderListFiltersToRouteQuery({
          ...DEFAULT_PURCHASE_ORDER_LIST_FILTERS,
          limit: filters.value.limit,
        }),
      },
    });
  }

  function setPage(page: number) {
    replaceFilters({ page });
  }

  function setLimit(limit: number) {
    replaceFilters({ page: 1, limit });
  }

  return {
    filters,
    replaceFilters,
    resetFilters,
    setPage,
    setLimit,
  };
}
