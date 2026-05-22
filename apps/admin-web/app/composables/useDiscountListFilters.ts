import {
  DEFAULT_DISCOUNT_LIST_FILTERS,
  discountListFiltersToRouteQuery,
  parseDiscountListFiltersFromQuery,
} from '~/lib/discount-filters';
import type { DiscountListFilters } from '~/types/discounts';

export function useDiscountListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<DiscountListFilters>(() =>
    parseDiscountListFiltersFromQuery(
      route.query as Record<string, string | string[] | undefined | null>,
    ),
  );

  function replaceFilters(next: Partial<DiscountListFilters>) {
    const preserved = {
      view: typeof route.query.view === 'string' ? route.query.view : undefined,
      sort: typeof route.query.sort === 'string' ? route.query.sort : undefined,
      direction:
        typeof route.query.direction === 'string' ? route.query.direction : undefined,
    };

    router.replace({
      query: {
        ...preserved,
        ...discountListFiltersToRouteQuery({ ...filters.value, ...next }),
      },
    });
  }

  function resetFilters() {
    const preserved = {
      view: typeof route.query.view === 'string' ? route.query.view : undefined,
      sort: typeof route.query.sort === 'string' ? route.query.sort : undefined,
      direction:
        typeof route.query.direction === 'string' ? route.query.direction : undefined,
    };

    router.replace({
      query: {
        ...preserved,
        ...discountListFiltersToRouteQuery({
          ...DEFAULT_DISCOUNT_LIST_FILTERS,
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

  return { filters, replaceFilters, resetFilters, setPage, setLimit };
}
