import type { AsyncDataOptions, KeysOf } from '#app/composables/asyncData';
import { isRef, toValue, type MaybeRefOrGetter } from 'vue';
import { useClientListRevalidation } from '~/composables/useClientListRevalidation';
import { useAdminSession } from '~/composables/useAdminSession';
import { getAdminSessionCacheSignature } from '~/lib/admin-session-cache';
import { resolveAdminLoadErrorStatus } from '~/utils/load-error-message';

export type AdminAuthenticatedAsyncDataOptions<
  ResT,
  DataT,
  PickKeys extends KeysOf<DataT>,
  DefaultT,
> = AsyncDataOptions<ResT, DataT, PickKeys, DefaultT> & {
  revalidateOnMount?: boolean;
  revalidateOnFocus?: boolean;
  staleAfterMs?: number;
  /**
   * Non-blocking navigation: render the route immediately, show cached data when
   * revisiting, and refresh in the background.
   */
  fastNav?: boolean;
};

export function readAdminAuthenticatedAsyncCache<ResT>(key: string): ResT | undefined {
  const cached = useNuxtData(key).data.value;
  return cached === undefined ? undefined : (cached as ResT);
}

/**
 * useAsyncData that waits for the admin session on the client before fetching.
 * Mirrors customer-web `useAuthenticatedAsyncData` for detail/dashboard routes.
 */
export function useAdminAuthenticatedAsyncData<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
>(
  key: MaybeRefOrGetter<string>,
  handler: () => Promise<ResT>,
  options?: AdminAuthenticatedAsyncDataOptions<ResT, DataT, PickKeys, DefaultT>,
) {
  const { whenReady, session, sessionResolved } = useAdminSession();
  const {
    revalidateOnMount = false,
    revalidateOnFocus,
    staleAfterMs,
    fastNav = false,
    lazy: lazyOption,
    getCachedData: getCachedDataOption,
    watch: watchOption,
    ...asyncDataOptions
  } = options ?? {};
  const resolvedRevalidateOnFocus = revalidateOnFocus ?? fastNav;
  const normalizedKey = computed(() => toValue(key));
  const hasReactiveWatch = Array.isArray(watchOption)
    ? watchOption.length > 0
    : watchOption != null && watchOption !== false;
  const isReactiveKey = isRef(key) || typeof key === 'function';
  // Paginated / filtered lists use `watch` — caching under one key would serve page 1 on page 2.
  const enableRouteCache =
    fastNav && !getCachedDataOption && !hasReactiveWatch && !isReactiveKey;
  const resolvedAtMap = useState<Record<string, number | null>>(
    'admin-authenticated-async-data:resolved-at',
    () => ({}),
  );

  const routeCacheKey = computed(() => {
    const base = normalizedKey.value;
    if (!enableRouteCache) {
      return base;
    }

    return `${base}:${getAdminSessionCacheSignature(session.value)}`;
  });

  const result = useAsyncData(
    routeCacheKey,
    async () => {
      if (import.meta.client) {
        await whenReady();
      }
      const response = await handler();
      resolvedAtMap.value[routeCacheKey.value] = Date.now();
      return response;
    },
    {
      ...asyncDataOptions,
      server: asyncDataOptions.server ?? (fastNav ? false : undefined),
      watch: watchOption,
      lazy: lazyOption ?? fastNav,
      getCachedData:
        getCachedDataOption ??
        (enableRouteCache ? (cacheKey) => readAdminAuthenticatedAsyncCache(cacheKey) : undefined),
    },
  );

  if (import.meta.client) {
    watch(
      sessionResolved,
      async (resolved) => {
        if (!resolved || !result.error.value) {
          return;
        }

        if (resolveAdminLoadErrorStatus(result.error.value) === 401) {
          await result.refresh();
        }
      },
      { immediate: true },
    );
  }

  useClientListRevalidation(
    {
      revalidateOnMount,
      revalidateOnFocus: resolvedRevalidateOnFocus,
      staleAfterMs,
    },
    {
      whenReady,
      getLastFetchedAt: () => resolvedAtMap.value[routeCacheKey.value] ?? null,
      refresh: () => result.refresh(),
    },
  );

  return result;
}
