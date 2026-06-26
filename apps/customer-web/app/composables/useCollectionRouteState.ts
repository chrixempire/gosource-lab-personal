import { useMediaQuery } from '@vueuse/core';

type ViewMode = 'cards' | 'table';
type SortDirection = 'asc' | 'desc';

export function useCollectionRouteState(defaultView: ViewMode = 'cards') {
  const route = useRoute();
  const router = useRouter();
  const isCompactViewport = useMediaQuery('(max-width: 999px)');

  const routeView = computed<ViewMode>(() => {
    if (route.query.view === 'table') {
      return 'table';
    }

    if (route.query.view === 'cards') {
      return 'cards';
    }

    return defaultView;
  });

  const effectiveView = computed<ViewMode>(() => {
    return isCompactViewport.value ? 'cards' : routeView.value;
  });

  const page = computed(() => {
    const parsed = Number(route.query.page ?? '1');
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const limit = computed(() => {
    const parsed = Number(route.query.limit ?? '10');
    return [10, 25, 50, 100].includes(parsed) ? parsed : 10;
  });

  const sortKey = computed(() => {
    const value = route.query.sort;
    return typeof value === 'string' && value.length > 0 ? value : '';
  });

  const sortDirection = computed<SortDirection>(() => {
    return route.query.direction === 'desc' ? 'desc' : 'asc';
  });

  function updateQuery(nextQuery: Record<string, string | undefined>) {
    router.replace({
      query: {
        ...route.query,
        ...nextQuery,
      },
    });
  }

  function setView(nextView: ViewMode) {
    if (isCompactViewport.value) {
      return;
    }

    updateQuery({
      view: nextView,
      page: '1',
    });
  }

  function setPage(nextPage: number) {
    updateQuery({
      page: String(Math.max(1, nextPage)),
    });
  }

  function setLimit(nextLimit: number) {
    updateQuery({
      limit: String(nextLimit),
      page: '1',
    });
  }

  function toggleSort(nextKey: string) {
    if (sortKey.value !== nextKey) {
      updateQuery({
        sort: nextKey,
        direction: 'asc',
        page: '1',
      });
      return;
    }

    updateQuery({
      sort: nextKey,
      direction: sortDirection.value === 'asc' ? 'desc' : 'asc',
      page: '1',
    });
  }

  return {
    isCompactViewport,
    routeView,
    effectiveView,
    page,
    limit,
    sortKey,
    sortDirection,
    setView,
    setPage,
    setLimit,
    toggleSort,
  };
}
