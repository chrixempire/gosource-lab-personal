import { clearNuxtData } from 'nuxt/app';
import { usePaginatedListCache } from '~/composables/usePaginatedListCache';

export const MANAGE_REQUESTS_LIST_BASE_KEY = 'manage-requests-index';
export const TRACK_ORDERS_LIST_BASE_KEY = 'track-orders-list';
export const CREDIT_PAGE_CACHE_KEY = 'credit-page';

/** Drop cached paginated list rows so the next visit refetches from the API. */
export function invalidateCustomerPaginatedListCache(baseKey: string) {
  if (!import.meta.client) {
    return;
  }

  usePaginatedListCache(baseKey).invalidateNamespace();
  clearNuxtData(
    (key) => key === baseKey || key.startsWith(`${baseKey}:`),
  );
}

/** Drop cached request list rows after cart/checkout/request mutations. */
export function invalidateManageRequestsListCache() {
  invalidateCustomerPaginatedListCache(MANAGE_REQUESTS_LIST_BASE_KEY);
}

/** Drop cached order list rows after checkout approval or order mutations. */
export function invalidateTrackOrdersListCache() {
  invalidateCustomerPaginatedListCache(TRACK_ORDERS_LIST_BASE_KEY);
}

/** Requests and orders both change when checkout completes. */
export function invalidateCheckoutMutationListCaches() {
  invalidateManageRequestsListCache();
  invalidateTrackOrdersListCache();
}

/** Drop cached credit dashboard payload so lists/account refresh after mutations. */
export function invalidateCreditPageCache() {
  if (!import.meta.client) {
    return;
  }

  const resolvedAtMap = useState<Record<string, number | null>>(
    'authenticated-async-data:resolved-at',
    () => ({}),
  );

  for (const key of Object.keys(resolvedAtMap.value)) {
    if (key === CREDIT_PAGE_CACHE_KEY || key.startsWith(`${CREDIT_PAGE_CACHE_KEY}:`)) {
      delete resolvedAtMap.value[key];
    }
  }

  clearNuxtData(
    (key) => key === CREDIT_PAGE_CACHE_KEY || key.startsWith(`${CREDIT_PAGE_CACHE_KEY}:`),
  );
}

/** Invalidate every registered paginated customer list (requests, orders, wallet, etc.). */
export function invalidateAllCustomerPaginatedListCaches() {
  if (!import.meta.client) {
    return;
  }

  const registry = useState<string[]>('paginated-list-cache:registry', () => []);

  for (const baseKey of registry.value) {
    invalidateCustomerPaginatedListCache(baseKey);
  }
}
