import {
  DEFAULT_PROMOTION_LIST_FILTERS,
  parsePromotionListFiltersFromQuery,
  promotionListFiltersToRouteQuery,
} from '~/lib/promotion-filters';
import type { PromotionListFilters } from '~/types/promotions';

export function usePromotionListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<PromotionListFilters>(() =>
    parsePromotionListFiltersFromQuery(
      route.query as Record<string, string | string[] | undefined | null>,
    ),
  );

  function replaceFilters(next: Partial<PromotionListFilters>) {
    const preserved = {
      view: typeof route.query.view === 'string' ? route.query.view : undefined,
    };

    router.replace({
      query: {
        ...preserved,
        ...promotionListFiltersToRouteQuery({ ...filters.value, ...next }),
      },
    });
  }

  function resetFilters() {
    const preserved = {
      view: typeof route.query.view === 'string' ? route.query.view : undefined,
    };

    router.replace({
      query: {
        ...preserved,
        ...promotionListFiltersToRouteQuery({
          ...DEFAULT_PROMOTION_LIST_FILTERS,
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
