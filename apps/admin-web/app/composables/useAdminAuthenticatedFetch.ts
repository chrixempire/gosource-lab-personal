import type { UseFetchOptions } from 'nuxt/app';
import { isRef, toValue, type MaybeRefOrGetter } from 'vue';
import {
  useAdminAuthenticatedAsyncData,
  type AdminAuthenticatedAsyncDataOptions,
} from '~/composables/useAdminAuthenticatedAsyncData';

type FetchQuery = Record<string, unknown> | undefined;

export type AdminAuthenticatedFetchOptions<T> = Omit<
  UseFetchOptions<T>,
  'lazy' | 'watch' | 'getCachedData' | 'key'
> &
  Pick<
    AdminAuthenticatedAsyncDataOptions<T, T, never, undefined>,
    'default' | 'transform' | 'pick' | 'revalidateOnMount' | 'staleAfterMs' | 'fastNav'
  > & {
    lazy?: boolean;
    watch?: UseFetchOptions<T>['watch'];
    getCachedData?: UseFetchOptions<T>['getCachedData'];
    key?: MaybeRefOrGetter<string>;
    query?: MaybeRefOrGetter<FetchQuery>;
  };

function resolveFetchKey(
  url: MaybeRefOrGetter<string>,
  keyOption: MaybeRefOrGetter<string> | undefined,
) {
  if (keyOption != null) {
    return computed(() => toValue(keyOption));
  }

  if (typeof url === 'function' || isRef(url)) {
    return computed(() => `admin-fetch:${toValue(url)}`);
  }

  return `admin-fetch:${toValue(url)}`;
}

function normalizeWatchArray<T>(watchOption: UseFetchOptions<T>['watch']) {
  if (Array.isArray(watchOption)) {
    return watchOption;
  }

  if (watchOption != null && watchOption !== false) {
    return [watchOption];
  }

  return [];
}

/**
 * Drop-in `useFetch` replacement for protected admin routes with optional fastNav.
 * List pages should keep using `useAdminListFetch`.
 */
export function useAdminAuthenticatedFetch<T>(
  url: MaybeRefOrGetter<string>,
  options?: AdminAuthenticatedFetchOptions<T>,
) {
  const {
    query,
    watch: watchOption,
    key: keyOption,
    fastNav = true,
    getCachedData: getCachedDataOption,
    ...rest
  } = options ?? {};

  const resolvedUrl = computed(() => toValue(url));
  const fetchKey = resolveFetchKey(url, keyOption);
  const querySnapshot = query != null ? computed(() => toValue(query) as FetchQuery) : null;
  const extraWatch = querySnapshot ? [querySnapshot] : [];

  return useAdminAuthenticatedAsyncData(
    fetchKey,
    async () =>
      $fetch<T>(resolvedUrl.value, {
        query: querySnapshot?.value,
      }),
    {
      fastNav,
      ...rest,
      getCachedData: getCachedDataOption,
      watch: [...normalizeWatchArray(watchOption), ...extraWatch],
    },
  );
}
