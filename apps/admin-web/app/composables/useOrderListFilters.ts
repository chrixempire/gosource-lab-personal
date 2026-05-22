import {
  DEFAULT_ORDER_LIST_FILTERS,
  orderListFiltersToRouteQuery,
  parseOrderListFiltersFromQuery,
} from '~/lib/order-filters';
import type { OrderListFilters } from '~/types/orders';

export function useOrderListFilters() {
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

  const filters = computed<OrderListFilters>(() =>
    parseOrderListFiltersFromQuery(
      route.query as Record<string, string | string[] | undefined | null>,
    ),
  );

  function replaceFilters(next: Partial<OrderListFilters>) {
    const merged: OrderListFilters = {
      ...filters.value,
      ...next,
    };

    router.replace({
      query: {
        ...buildPersistentQuery(),
        ...orderListFiltersToRouteQuery(merged),
      },
    });
  }

  function setFilters(next: OrderListFilters) {
    router.replace({
      query: {
        ...buildPersistentQuery(),
        ...orderListFiltersToRouteQuery(next),
      },
    });
  }

  function resetFilters() {
    router.replace({
      query: {
        ...buildPersistentQuery(),
        ...orderListFiltersToRouteQuery({
          ...DEFAULT_ORDER_LIST_FILTERS,
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
    setFilters,
    resetFilters,
    setPage,
    setLimit,
  };
}
