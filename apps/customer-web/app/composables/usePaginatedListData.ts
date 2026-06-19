import { toValue, type MaybeRefOrGetter } from 'vue';
import { buildCollectionListKey } from '~/lib/collection-list-key';
import {
  readAuthenticatedAsyncCache,
  useAuthenticatedAsyncData,
  type AuthenticatedAsyncDataOptions,
} from '~/composables/useAuthenticatedAsyncData';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';
import {
  paginatedListFilterSignature,
  usePaginatedListCache,
} from '~/composables/usePaginatedListCache';
import { useClientListRevalidation } from '~/composables/useClientListRevalidation';

type ListKeyPart = string | number | boolean | null | undefined;

function resolveListCachedData<ResT>(
  signature: string,
  pageCache: ReturnType<typeof usePaginatedListCache<ResT>>,
): ResT | undefined {
  const fromPageCache = pageCache.get(signature);
  if (fromPageCache !== undefined) {
    return fromPageCache;
  }

  return readAuthenticatedAsyncCache<ResT>(signature);
}

/**
 * Paginated list fetch with per-page cache: revisiting a page shows cached rows
 * instantly while Nuxt refetches in the background.
 *
 * Uses a stable async-data key plus `watch` on the list signature so page/filter
 * changes always refetch the correct slice (reactive keys alone reuse stale rows).
 */
export async function usePaginatedListData<ResT, DataT = ResT>(
  baseKey: string,
  keyParts: MaybeRefOrGetter<ListKeyPart[]>,
  handler: () => Promise<ResT>,
  options?: AuthenticatedAsyncDataOptions<ResT, DataT, never, undefined> & {
    pageCache?: boolean;
    revalidateOnFocus?: boolean;
  },
) {
  const { whenReady, session } = useCustomerSession();
  const listCacheBaseKey = computed(
    () => `${baseKey}:${getCustomerSessionCacheSignature(session.value)}`,
  );
  const watchSignature = computed(() =>
    buildCollectionListKey(listCacheBaseKey.value, toValue(keyParts)),
  );
  const listFilterSignature = computed(() =>
    paginatedListFilterSignature(watchSignature.value, listCacheBaseKey.value),
  );
  const pageCache = usePaginatedListCache<ResT>(baseKey);

  const {
    pageCache: pageCacheEnabled = true,
    revalidateOnMount = true,
    revalidateOnFocus = true,
    staleAfterMs,
    getCachedData: getCachedDataOption,
    watch: extraWatch,
    ...rest
  } = options ?? {};

  const extraWatchArray = Array.isArray(extraWatch)
    ? extraWatch
    : extraWatch != null && extraWatch !== false
      ? [extraWatch]
      : [];

  async function fetchAndCache() {
    if (import.meta.client) {
      await whenReady();
    }

    const signatureAtStart = watchSignature.value;
    const response = await handler();

    if (signatureAtStart !== watchSignature.value) {
      const staleFallback = pageCacheEnabled
        ? resolveListCachedData(watchSignature.value, pageCache)
        : undefined;

      if (staleFallback !== undefined) {
        return staleFallback;
      }

      const defaultValue = rest.default;
      if (typeof defaultValue === 'function') {
        return defaultValue() as ResT;
      }

      if (defaultValue !== undefined) {
        return defaultValue as ResT;
      }
    }

    if (pageCacheEnabled) {
      pageCache.set(signatureAtStart, response);
    }

    return response;
  }

  const result = await useAuthenticatedAsyncData(baseKey, fetchAndCache, {
    fastNav: true,
    ...rest,
    revalidateOnMount: false,
    watch: [watchSignature, ...extraWatchArray],
    getCachedData:
      getCachedDataOption ??
      (pageCacheEnabled
        ? () => resolveListCachedData(watchSignature.value, pageCache)
        : undefined),
  });

  if (import.meta.client && pageCacheEnabled) {
    function applyCacheForSignature(signature = watchSignature.value) {
      const cached = pageCache.get(signature);
      if (cached !== undefined) {
        result.data.value = cached as DataT;
        return;
      }

      const defaultValue = rest.default;
      if (typeof defaultValue === 'function') {
        result.data.value = defaultValue() as DataT;
        return;
      }

      if (defaultValue !== undefined) {
        result.data.value = defaultValue as DataT;
      }
    }

    useClientListRevalidation(
      {
        revalidateOnMount,
        revalidateOnFocus,
        staleAfterMs,
      },
      {
        whenReady,
        getLastFetchedAt: () => pageCache.getFetchedAt(watchSignature.value),
        refresh: () => result.refresh(),
        hydrate: () => applyCacheForSignature(),
      },
    );

    watch(watchSignature, (newSignature, oldSignature) => {
      if (!oldSignature || newSignature === oldSignature) {
        return;
      }

      applyCacheForSignature(newSignature);
    });

    watch(listCacheBaseKey, async (next, prev) => {
      if (!prev || next === prev) {
        return;
      }

      pageCache.invalidateNamespace();
      await result.refresh();
    });

    watch(listFilterSignature, (next, prev) => {
      if (prev && next !== prev) {
        pageCache.invalidateNamespace();
      }
    });
  }

  async function refreshList() {
    pageCache.invalidateNamespace();
    return result.refresh();
  }

  function invalidateListCache() {
    pageCache.invalidateNamespace();
  }

  return {
    ...result,
    refresh: refreshList,
    invalidateListCache,
  };
}
