type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

export function paginatedListFilterSignature(
  fullSignature: string,
  namespace: string,
  pagePartIndex = 0,
) {
  const prefix = `${namespace}:`;
  if (!fullSignature.startsWith(prefix)) {
    return fullSignature;
  }

  const parts = fullSignature.slice(prefix.length).split('|');
  return parts.filter((_, index) => index !== pagePartIndex).join('|');
}

export function usePaginatedListCache<T>(namespace: string) {
  const registry = useState<string[]>('paginated-list-cache:registry', () => []);
  if (!registry.value.includes(namespace)) {
    registry.value = [...registry.value, namespace];
  }

  const store = useState<Record<string, CacheEntry<T>>>(
    `paginated-list-cache:${namespace}`,
    () => ({}),
  );

  const prefix = `${namespace}:`;

  function get(key: string): T | undefined {
    return store.value[key]?.data;
  }

  function getFetchedAt(key: string): number | null {
    return store.value[key]?.fetchedAt ?? null;
  }

  function set(key: string, data: T) {
    store.value = {
      ...store.value,
      [key]: { data, fetchedAt: Date.now() },
    };
  }

  function invalidateKey(key: string) {
    if (!(key in store.value)) {
      return;
    }

    const next = { ...store.value };
    delete next[key];
    store.value = next;
  }

  function invalidateNamespace() {
    const next = { ...store.value };
    let changed = false;

    for (const key of Object.keys(next)) {
      if (key.startsWith(prefix)) {
        delete next[key];
        changed = true;
      }
    }

    if (changed) {
      store.value = next;
    }
  }

  return {
    get,
    set,
    getFetchedAt,
    invalidateKey,
    invalidateNamespace,
  };
}
