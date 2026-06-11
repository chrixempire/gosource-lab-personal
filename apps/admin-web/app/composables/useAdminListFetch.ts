import type { UseFetchOptions } from 'nuxt/app';
import { toValue } from 'vue';
import { useAdminSession } from '~/composables/useAdminSession';
import { usePaginatedListCache } from '~/composables/usePaginatedListCache';
import { buildAdminFetchKey, buildAdminListFilterSignature } from '~/lib/collection-list-key';
import { getAdminSessionCacheSignature } from '~/lib/admin-session-cache';

function readCachedFetchData<T>(key: string): T | undefined {
  const cached = useNuxtData(key).data.value;
  return cached === undefined ? undefined : (cached as T);
}

type AdminListFetchOptions<T> = UseFetchOptions<T> & {
  pageCache?: boolean;
};

/**
 * List-page fetch that does not block client-side navigation.
 * With `watch` + `query`, each page/filter combo is cached for instant revisit
 * while useFetch refetches when the query signature changes.
 */
export function useAdminListFetch<T>(
  url: string | (() => string),
  options?: AdminListFetchOptions<T>,
) {
  const {
    lazy,
    getCachedData,
    watch: watchOption,
    key: keyOption,
    query,
    pageCache: pageCacheEnabled = true,
    ...rest
  } = options ?? {};

  const hasReactiveWatch = Array.isArray(watchOption)
    ? watchOption.length > 0
    : watchOption != null && watchOption !== false;

  const { session } = useAdminSession();
  const sessionSignature = computed(() => getAdminSessionCacheSignature(session.value));
  const resolvedUrl = computed(() => toValue(url));

  function withSessionScope(key: string) {
    return `${key}:${sessionSignature.value}`;
  }

  const usePageCache = hasReactiveWatch && pageCacheEnabled && query != null;
  const pageCache = usePageCache ? usePaginatedListCache<T>(resolvedUrl.value) : null;

  const querySignature = computed(() => {
    if (!usePageCache) {
      return '';
    }

    const resolvedQuery = toValue(query) as Record<string, unknown>;
    return withSessionScope(buildAdminFetchKey(resolvedUrl.value, resolvedQuery));
  });

  const listFilterSignature = computed(() => {
    if (!usePageCache) {
      return '';
    }

    const resolvedQuery = toValue(query) as Record<string, unknown>;
    return withSessionScope(buildAdminListFilterSignature(resolvedUrl.value, resolvedQuery));
  });

  const fetchKey = computed(() => {
    if (keyOption != null) {
      return withSessionScope(toValue(keyOption));
    }

    if (hasReactiveWatch) {
      return withSessionScope(resolvedUrl.value);
    }

    const resolvedQuery = query ? (toValue(query) as Record<string, unknown>) : null;
    return withSessionScope(buildAdminFetchKey(resolvedUrl.value, resolvedQuery));
  });

  const fetchResult = useFetch(url, {
    ...rest,
    query,
    key: fetchKey,
    watch: watchOption,
    lazy: lazy ?? true,
    getCachedData:
      getCachedData ??
      (usePageCache
        ? () =>
            pageCache!.get(querySignature.value) ??
            readCachedFetchData<T>(querySignature.value)
        : hasReactiveWatch
          ? undefined
          : (key) => readCachedFetchData<T>(key)),
  });

  if (import.meta.client && usePageCache && pageCache) {
    function hydrateFromPageCache(signature = querySignature.value) {
      const cached = pageCache.get(signature);
      if (cached !== undefined) {
        fetchResult.data.value = cached as T;
      }
    }

    watch(
      () => fetchResult.data.value,
      (data) => {
        if (data !== undefined && data !== null) {
          pageCache.set(querySignature.value, data as T);
        }
      },
    );

    watch(listFilterSignature, (next, prev) => {
      if (prev && next !== prev) {
        pageCache.invalidateNamespace();
      }
    });

    onMounted(() => {
      hydrateFromPageCache();
    });

    watch(querySignature, (newSignature, oldSignature) => {
      if (!oldSignature || newSignature === oldSignature) {
        return;
      }

      hydrateFromPageCache(newSignature);
    });
  }

  async function refreshList() {
    pageCache?.invalidateNamespace();
    return fetchResult.refresh();
  }

  function invalidateListCache() {
    pageCache?.invalidateNamespace();
  }

  if (!usePageCache) {
    return fetchResult;
  }

  return {
    ...fetchResult,
    refresh: refreshList,
    invalidateListCache,
  };
}
