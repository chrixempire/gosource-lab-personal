import type { AsyncDataOptions, KeysOf } from '#app/composables/asyncData';
import { toValue, type MaybeRefOrGetter } from 'vue';
import { useCustomerSession } from '~/composables/useCustomerSession';

type AuthenticatedAsyncDataOptions<
  ResT,
  DataT,
  PickKeys extends KeysOf<DataT>,
  DefaultT,
> = AsyncDataOptions<ResT, DataT, PickKeys, DefaultT> & {
  revalidateOnMount?: boolean;
  staleAfterMs?: number;
};

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
  const { whenReady } = useCustomerSession();
  const {
    revalidateOnMount = false,
    staleAfterMs,
    ...asyncDataOptions
  } = options ?? {};
  const normalizedKey = computed(() => toValue(key));
  const resolvedAtMap = useState<Record<string, number | null>>(
    'authenticated-async-data:resolved-at',
    () => ({}),
  );

  const result = await useAsyncData(
    normalizedKey,
    async () => {
      if (import.meta.client) {
        await whenReady();
      }
      const response = await handler();
      resolvedAtMap.value[normalizedKey.value] = Date.now();
      return response;
    },
    asyncDataOptions,
  );

  if (import.meta.client && (revalidateOnMount || typeof staleAfterMs === 'number')) {
    onMounted(async () => {
      await whenReady();

      const resolvedAt = resolvedAtMap.value[normalizedKey.value];
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
