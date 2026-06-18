import { clearNuxtData } from 'nuxt/app';
import { usePaginatedListCache } from '~/composables/usePaginatedListCache';
import { useAdminSession } from '~/composables/useAdminSession';
import { getAdminSessionCacheSignature } from '~/lib/admin-session-cache';
import { ADMIN_LIST_CACHE_KEY_ALIASES, ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';

function adminListCacheNamespaces(url: string): string[] {
  const aliases = ADMIN_LIST_CACHE_KEY_ALIASES[url as keyof typeof ADMIN_LIST_CACHE_KEY_ALIASES] ?? [];
  return [url, ...aliases];
}

/**
 * Drop cached list payloads after a mutation so revisiting a list route
 * does not hydrate stale rows from the paginated list cache or useNuxtData.
 */
export function invalidateAdminListCache(url: string) {
  if (!import.meta.client) {
    return;
  }

  const { session } = useAdminSession();
  const sessionSignature = getAdminSessionCacheSignature(session.value);
  const namespaces = adminListCacheNamespaces(url);

  for (const namespace of namespaces) {
    usePaginatedListCache(namespace).invalidateNamespace();
  }

  clearNuxtData((key) =>
    namespaces.some(
      (namespace) =>
        key === namespace ||
        key === `${namespace}:${sessionSignature}` ||
        key.startsWith(`${namespace}:`),
    ),
  );
}

export function invalidateAdminListCaches(urls: readonly string[]) {
  for (const url of urls) {
    invalidateAdminListCache(url);
  }
}

export function invalidateCreditApplicationLists() {
  invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.creditApplications);
}

export function invalidateCreditRequestLists() {
  invalidateAdminListCaches([
    ADMIN_LIST_CACHE_URLS.creditRequests,
    ADMIN_LIST_CACHE_URLS.creditRequestStats,
  ]);
}

export function invalidateCreditRepaymentLists() {
  invalidateAdminListCaches([
    ADMIN_LIST_CACHE_URLS.creditRepayments,
    ADMIN_LIST_CACHE_URLS.creditRepaymentSchedules,
    ADMIN_LIST_CACHE_URLS.creditRepaymentSchedulesOverdue,
  ]);
}

/** Invalidate every registered admin paginated list cache namespace. */
export function invalidateAllAdminPaginatedListCaches() {
  if (!import.meta.client) {
    return;
  }

  const registry = useState<string[]>('paginated-list-cache:registry', () => []);

  for (const url of registry.value) {
    invalidateAdminListCache(url);
  }
}
