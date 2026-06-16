import {
  creditApplicationListFiltersToRouteQuery,
  creditOverdueListFiltersToRouteQuery,
  creditRepaymentListFiltersToRouteQuery,
  creditRequestListFiltersToRouteQuery,
  creditScheduleListFiltersToRouteQuery,
  DEFAULT_CREDIT_APPLICATION_LIST_FILTERS,
  DEFAULT_CREDIT_REPAYMENT_LIST_FILTERS,
  DEFAULT_CREDIT_REQUEST_LIST_FILTERS,
  DEFAULT_CREDIT_SCHEDULE_LIST_FILTERS,
  parseCreditApplicationListFiltersFromQuery,
  parseCreditOverdueListFiltersFromQuery,
  parseCreditRepaymentListFiltersFromQuery,
  parseCreditRequestListFiltersFromQuery,
  parseCreditScheduleListFiltersFromQuery,
  type CreditOverdueListFilters,
} from '~/lib/credit-filters';
import type {
  CreditApplicationListFilters,
  CreditRepaymentListFilters,
  CreditRequestListFilters,
  CreditScheduleListFilters,
} from '~/types/credit';

type RouteQuery = Record<string, string | string[] | undefined | null>;

function readPersistentQuery(route: ReturnType<typeof useRoute>) {
  const next: Record<string, string> = {};
  const view = route.query.view;
  if (typeof view === 'string' && view.length > 0) {
    next.view = view;
  }
  const tab = route.query.tab;
  if (typeof tab === 'string' && tab.length > 0) {
    next.tab = tab;
  }
  return next;
}

export function useCreditRequestListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<CreditRequestListFilters>(() =>
    parseCreditRequestListFiltersFromQuery(route.query as RouteQuery),
  );

  function replaceFilters(next: Partial<CreditRequestListFilters>) {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditRequestListFiltersToRouteQuery({ ...filters.value, ...next }),
      },
    });
  }

  function resetFilters() {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditRequestListFiltersToRouteQuery({
          ...DEFAULT_CREDIT_REQUEST_LIST_FILTERS,
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

export function useCreditApplicationListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<CreditApplicationListFilters>(() =>
    parseCreditApplicationListFiltersFromQuery(route.query as RouteQuery),
  );

  function replaceFilters(next: Partial<CreditApplicationListFilters>) {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditApplicationListFiltersToRouteQuery({ ...filters.value, ...next }),
      },
    });
  }

  function resetFilters() {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditApplicationListFiltersToRouteQuery({
          ...DEFAULT_CREDIT_APPLICATION_LIST_FILTERS,
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

export function useCreditRepaymentListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<CreditRepaymentListFilters>(() =>
    parseCreditRepaymentListFiltersFromQuery(route.query as RouteQuery),
  );

  function replaceFilters(next: Partial<CreditRepaymentListFilters>) {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditRepaymentListFiltersToRouteQuery({ ...filters.value, ...next }),
      },
    });
  }

  function resetFilters() {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditRepaymentListFiltersToRouteQuery({
          ...DEFAULT_CREDIT_REPAYMENT_LIST_FILTERS,
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

export function useCreditScheduleListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<CreditScheduleListFilters>(() =>
    parseCreditScheduleListFiltersFromQuery(route.query as RouteQuery),
  );

  const overdueFilters = computed<CreditOverdueListFilters>(() =>
    parseCreditOverdueListFiltersFromQuery(route.query as RouteQuery),
  );

  function replaceFilters(next: Partial<CreditScheduleListFilters>) {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditScheduleListFiltersToRouteQuery({ ...filters.value, ...next }),
        ...creditOverdueListFiltersToRouteQuery(overdueFilters.value),
      },
    });
  }

  function replaceOverdueFilters(next: Partial<CreditOverdueListFilters>) {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditScheduleListFiltersToRouteQuery(filters.value),
        ...creditOverdueListFiltersToRouteQuery({ ...overdueFilters.value, ...next }),
      },
    });
  }

  function resetFilters() {
    router.replace({
      query: {
        ...readPersistentQuery(route),
        ...creditScheduleListFiltersToRouteQuery({
          ...DEFAULT_CREDIT_SCHEDULE_LIST_FILTERS,
          limit: filters.value.limit,
        }),
        ...creditOverdueListFiltersToRouteQuery({
          page: 1,
          limit: overdueFilters.value.limit,
          search: '',
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

  function setOverduePage(page: number) {
    replaceOverdueFilters({ page });
  }

  function setOverdueLimit(limit: number) {
    replaceOverdueFilters({ page: 1, limit });
  }

  return {
    filters,
    overdueFilters,
    replaceFilters,
    replaceOverdueFilters,
    resetFilters,
    setPage,
    setLimit,
    setOverduePage,
    setOverdueLimit,
  };
}
