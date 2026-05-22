import type { ShoppingListRecord } from '@gosource/api-client';

export function useShoppingListBranchCache() {
  const cache = useState<Record<string, ShoppingListRecord[]>>(
    'shopping-list-branch-cache',
    () => ({}),
  );

  function getCachedLists(branchId: string) {
    return cache.value[branchId] ?? [];
  }

  function setCachedLists(branchId: string, lists: ShoppingListRecord[]) {
    cache.value = {
      ...cache.value,
      [branchId]: lists,
    };
  }

  return {
    getCachedLists,
    setCachedLists,
  };
}

export function extractShoppingListArray(payload: unknown): ShoppingListRecord[] {
  if (Array.isArray(payload)) {
    return payload as ShoppingListRecord[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as { data?: unknown };
  if (Array.isArray(root.data)) {
    return root.data as ShoppingListRecord[];
  }

  return [];
}
