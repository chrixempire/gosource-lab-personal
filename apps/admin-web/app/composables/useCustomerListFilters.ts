import {
  DEFAULT_CUSTOMER_LIST_FILTERS,
  customerListFiltersToRouteQuery,
  parseCustomerListFiltersFromQuery,
} from '~/lib/customer-filters';
import type { CustomerListFilters } from '~/types/customers';

export function useCustomerListFilters() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<CustomerListFilters>(() =>
    parseCustomerListFiltersFromQuery(
      route.query as Record<string, string | string[] | undefined | null>,
    ),
  );

  function replaceFilters(next: Partial<CustomerListFilters>) {
    router.replace({
      query: customerListFiltersToRouteQuery({ ...filters.value, ...next }),
    });
  }

  function resetFilters() {
    router.replace({
      query: customerListFiltersToRouteQuery({
        ...DEFAULT_CUSTOMER_LIST_FILTERS,
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
