import type { UseFetchOptions } from 'nuxt/app';
import { toValue } from 'vue';
import { useAdminAuthenticatedAsyncData } from '~/composables/useAdminAuthenticatedAsyncData';
import { useAdminPaginatedListData } from '~/composables/useAdminPaginatedListData';
import { useAdminRequestFetch } from '~/composables/useAdminRequestFetch';
import { useAdminSession } from '~/composables/useAdminSession';
import { getAdminSessionCacheSignature } from '~/lib/admin-session-cache';
import { listQueryToKeyParts } from '~/lib/list-query-key-parts';

type AdminListFetchOptions<T> = UseFetchOptions<T> & {
  pageCache?: boolean;
};

/**
 * List-page fetch for admin tables.
 *
 * When `query` is provided, delegates to `useAdminPaginatedListData` (stable key +
 * watched signature + per-page cache) — the same pattern used in customer-web.
 */
export async function useAdminListFetch<T>(
  url: string | (() => string),
  options?: AdminListFetchOptions<T>,
) {
  const {
    lazy,
    watch: watchOption,
    key: keyOption,
    query,
    pageCache: pageCacheEnabled = true,
    ...rest
  } = options ?? {};

  const resolvedUrl = computed(() => toValue(url));
  const apiFetch = useAdminRequestFetch();

  if (query == null) {
    const { session } = useAdminSession();
    const sessionSignature = computed(() => getAdminSessionCacheSignature(session.value));
    const fetchKey = computed(() => {
      const base = keyOption != null ? toValue(keyOption) : resolvedUrl.value;
      return `${base}:${sessionSignature.value}`;
    });

    return useAdminAuthenticatedAsyncData(
      fetchKey,
      () => apiFetch<T>(resolvedUrl.value),
      {
        ...rest,
        fastNav: true,
        lazy: lazy ?? true,
        server: rest.server ?? false,
      },
    );
  }

  const baseKey = keyOption != null ? String(toValue(keyOption)) : resolvedUrl.value;
  const keyParts = computed(() =>
    listQueryToKeyParts(toValue(query) as Record<string, unknown>),
  );

  const extraWatch = Array.isArray(watchOption)
    ? watchOption
    : watchOption != null && watchOption !== false
      ? [watchOption]
      : [];

  return useAdminPaginatedListData<T>(
    baseKey,
    keyParts,
    () => apiFetch<T>(toValue(url), { query: toValue(query) }),
    {
      ...rest,
      lazy: lazy ?? true,
      server: rest.server ?? false,
      pageCache: pageCacheEnabled,
      watch: extraWatch.length > 0 ? extraWatch : undefined,
    },
  );
}
