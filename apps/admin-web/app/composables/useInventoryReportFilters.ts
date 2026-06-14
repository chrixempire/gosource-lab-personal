import { toDashboardQueryParams } from '~/lib/dashboard-date';
import { useDashboardDateFilter } from '~/composables/useDashboardDateFilter';

function flatRouteQuery(query: Record<string, string | string[] | undefined | null>) {
  return Object.fromEntries(
    Object.entries(query).flatMap(([key, entry]) => {
      const resolved = Array.isArray(entry) ? entry[0] : entry;
      if (typeof resolved !== 'string') {
        return [];
      }
      return [[key, resolved]];
    }),
  ) as Record<string, string>;
}

export function useInventoryReportFilters() {
  const route = useRoute();
  const router = useRouter();
  const { filter: dateFilter } = useDashboardDateFilter();

  const page = computed(() => Math.max(1, Number(route.query.page) || 1));
  const limit = computed(() => Math.max(1, Number(route.query.limit) || 10));
  const search = computed(() => String(route.query.search ?? '').trim());

  function replaceQuery(patch: Record<string, string | undefined>) {
    const next = { ...flatRouteQuery(route.query), ...patch };

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') {
        delete next[key];
      }
    }

    router.replace({ query: next });
  }

  function setPage(nextPage: number) {
    replaceQuery({ page: String(nextPage) });
  }

  function setLimit(nextLimit: number) {
    replaceQuery({ page: '1', limit: String(nextLimit) });
  }

  function setSearch(nextSearch: string) {
    const trimmed = nextSearch.trim();
    replaceQuery({
      search: trimmed || undefined,
      page: '1',
    });
  }

  const apiQuery = computed(() => ({
    ...toDashboardQueryParams(dateFilter.value),
    page: page.value,
    limit: limit.value,
    ...(search.value ? { search: search.value } : {}),
  }));

  return {
    dateFilter,
    page,
    limit,
    search,
    apiQuery,
    setPage,
    setLimit,
    setSearch,
  };
}
