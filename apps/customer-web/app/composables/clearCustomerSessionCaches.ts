import { clearNuxtData } from 'nuxt/app';

/**
 * Drop client-side authenticated route caches when the signed-in user changes
 * (logout or fresh login) so another account cannot see stale data.
 */
export function clearCustomerSessionCaches() {
  if (!import.meta.client) {
    return;
  }

  clearNuxtData();

  const resolvedAt = useState<Record<string, number | null>>(
    'authenticated-async-data:resolved-at',
    () => ({}),
  );
  resolvedAt.value = {};

  const registry = useState<string[]>('paginated-list-cache:registry', () => []);
  for (const namespace of registry.value) {
    const store = useState<Record<string, unknown>>(`paginated-list-cache:${namespace}`, () => ({}));
    store.value = {};
  }
}
