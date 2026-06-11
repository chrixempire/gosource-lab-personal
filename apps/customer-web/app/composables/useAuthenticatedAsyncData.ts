import type { AsyncDataOptions, KeysOf } from '#app/composables/asyncData';
import { isRef, toValue, type MaybeRefOrGetter } from 'vue';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';

export type AuthenticatedAsyncDataOptions<
  ResT,
  DataT,
  PickKeys extends KeysOf<DataT>,
  DefaultT,
> = AsyncDataOptions<ResT, DataT, PickKeys, DefaultT> & {
  revalidateOnMount?: boolean;
  staleAfterMs?: number;
  /**
   * Non-blocking navigation: render the route immediately, show cached data when
   * revisiting, and refresh in the background.
   */
  fastNav?: boolean;
};

export function readAuthenticatedAsyncCache<ResT>(key: string): ResT | undefined {
  const cached = useNuxtData(key).data.value;
  return cached === undefined ? undefined : (cached as ResT);
}

/**
 * useAsyncData that waits for the customer session on the client before fetching.
 * Prevents empty SSR/hydration payloads when /me has not completed yet on reload.
 */
export async function useAuthenticatedAsyncData<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
>(
  key: MaybeRefOrGetter<string>,
  handler: () => Promise<ResT>,
  options?: AuthenticatedAsyncDataOptions<ResT, DataT, PickKeys, DefaultT>,
) {
  const { whenReady, session } = useCustomerSession();
  const {
    revalidateOnMount = false,
    staleAfterMs,
    fastNav = false,
    lazy: lazyOption,
    getCachedData: getCachedDataOption,
    watch: watchOption,
    ...asyncDataOptions
  } = options ?? {};
  const normalizedKey = computed(() => toValue(key));
  const hasReactiveWatch = Array.isArray(watchOption)
    ? watchOption.length > 0
    : watchOption != null && watchOption !== false;
  const isReactiveKey = isRef(key) || typeof key === 'function';
  // Paginated / filtered lists use `watch` — caching under one key would serve page 1 on page 2.
  const enableRouteCache =
    fastNav && !getCachedDataOption && !hasReactiveWatch && !isReactiveKey;
  const resolvedAtMap = useState<Record<string, number | null>>(
    'authenticated-async-data:resolved-at',
    () => ({}),
  );

  const routeCacheKey = computed(() => {
    const base = normalizedKey.value;
    if (!enableRouteCache) {
      return base;
    }

    return `${base}:${getCustomerSessionCacheSignature(session.value)}`;
  });

  const result = await useAsyncData(
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
      watch: watchOption,
      lazy: lazyOption ?? fastNav,
      getCachedData:
        getCachedDataOption ??
        (enableRouteCache ? (cacheKey) => readAuthenticatedAsyncCache(cacheKey) : undefined),
    },
  );

  if (import.meta.client && (revalidateOnMount || typeof staleAfterMs === 'number')) {
    onMounted(async () => {
      await whenReady();

      const resolvedAt = resolvedAtMap.value[routeCacheKey.value];
      const age = resolvedAt ? Date.now() - resolvedAt : Number.POSITIVE_INFINITY;
      const shouldRevalidate =
        revalidateOnMount ||
        (typeof staleAfterMs === 'number' && age >= staleAfterMs);

      if (shouldRevalidate) {
        await result.refresh();
      }
    });
  }

  return result;
}
