import { clearNuxtData } from 'nuxt/app';
import { usePaginatedListCache } from '~/composables/usePaginatedListCache';
import { useAdminSession } from '~/composables/useAdminSession';
import { getAdminSessionCacheSignature } from '~/lib/admin-session-cache';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';

/**
 * Drop cached list payloads after a mutation so revisiting a list route
 * does not hydrate stale rows from the paginated list cache or useNuxtData.
 */
export function invalidateAdminListCache(url: string) {
  if (!import.meta.client) {
    return;
  }

  usePaginatedListCache(url).invalidateNamespace();

  const { session } = useAdminSession();
  const sessionSignature = getAdminSessionCacheSignature(session.value);
  const scopedUrl = `${url}:${sessionSignature}`;

  clearNuxtData(
    (key) => key === scopedUrl || key.startsWith(`${url}:`),
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
