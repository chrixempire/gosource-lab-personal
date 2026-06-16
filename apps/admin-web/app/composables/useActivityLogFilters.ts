import {
  DEFAULT_ACTIVITY_LOG_FILTERS,
  activityLogFiltersToRouteQuery,
  parseActivityLogFiltersFromQuery,
} from '~/lib/activity-log-filters';
import type { ActivityLogListFilters } from '~/types/activity-log';

export function useActivityLogFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<ActivityLogListFilters>(() =>
    parseActivityLogFiltersFromQuery(
      route.query as Record<string, string | string[] | undefined | null>,
    ),
  );

  function replaceFilters(next: Partial<ActivityLogListFilters>) {
    router.replace({
      query: activityLogFiltersToRouteQuery({ ...filters.value, ...next }),
    });
  }

  function resetFilters() {
    router.replace({
      query: activityLogFiltersToRouteQuery({
        ...DEFAULT_ACTIVITY_LOG_FILTERS,
        limit: filters.value.limit,
      }),
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
