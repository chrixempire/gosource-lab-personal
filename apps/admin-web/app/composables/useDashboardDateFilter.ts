import {
  createDefaultDashboardDateFilter,
  parseDashboardDateFilterFromQuery,
} from '~/lib/dashboard-date';
import type { DashboardDateFilterValue } from '~/types/dashboard';

export function useDashboardDateFilter() {
  const route = useRoute();
  const router = useRouter();

  const filter = computed<DashboardDateFilterValue>({
    get() {
      return parseDashboardDateFilterFromQuery(route.query);
    },
    set(value) {
      const nextQuery: Record<string, string> = {
        ...Object.fromEntries(
          Object.entries(route.query).flatMap(([key, entry]) => {
            const resolved = Array.isArray(entry) ? entry[0] : entry;
            if (typeof resolved !== 'string') {
              return [];
            }
            return [[key, resolved]];
          }),
        ),
        filter: value.filterType,
      };

      if (value.filterType === 'custom_range' && value.startDate && value.endDate) {
        nextQuery.startDate = value.startDate;
        nextQuery.endDate = value.endDate;
      } else {
        delete nextQuery.startDate;
        delete nextQuery.endDate;
      }

      router.replace({ query: nextQuery });
    },
  });

  onMounted(() => {
    if (!route.query.filter) {
      filter.value = createDefaultDashboardDateFilter();
    }
  });

  return { filter };
}
