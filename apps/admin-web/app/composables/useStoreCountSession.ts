import { STORE_COUNT_DRAFT_STORAGE_KEY } from '~/lib/store-count-constants';

type StoreCountDraftEntry = {
  id: string;
  countedQuantity: number;
};

export function useStoreCountSession() {
  const countedByProductId = ref<Record<string, number>>({});

  const changedRows = computed(() =>
    Object.entries(countedByProductId.value)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([productId, countedQuantity]) => ({
        productId,
        countedQuantity: Number(countedQuantity),
      })),
  );

  const changedCount = computed(() => changedRows.value.length);

  function setCountedQuantity(productId: string, quantity: number) {
    const parsed = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
    if (parsed <= 0) {
      const next = { ...countedByProductId.value };
      delete next[productId];
      countedByProductId.value = next;
      return;
    }

    countedByProductId.value = {
      ...countedByProductId.value,
      [productId]: parsed,
    };
  }

  function clearDraft() {
    if (import.meta.client) {
      localStorage.removeItem(STORE_COUNT_DRAFT_STORAGE_KEY);
    }
  }

  function saveDraft() {
    if (!import.meta.client) {
      return;
    }

    const draft: StoreCountDraftEntry[] = changedRows.value.map((row) => ({
      id: row.productId,
      countedQuantity: row.countedQuantity,
    }));

    localStorage.setItem(STORE_COUNT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }

  function loadDraft() {
    if (!import.meta.client) {
      return;
    }

    try {
      const raw = localStorage.getItem(STORE_COUNT_DRAFT_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const draft = JSON.parse(raw) as StoreCountDraftEntry[];
      if (!Array.isArray(draft)) {
        return;
      }

      const next: Record<string, number> = {};
      for (const entry of draft) {
        if (entry?.id && Number(entry.countedQuantity) > 0) {
          next[entry.id] = Number(entry.countedQuantity);
        }
      }
      countedByProductId.value = next;
    } catch {
      // ignore invalid draft
    }
  }

  function clearAfterSubmit() {
    countedByProductId.value = {};
    clearDraft();
  }

  return {
    countedByProductId,
    changedRows,
    changedCount,
    setCountedQuantity,
    saveDraft,
    loadDraft,
    clearAfterSubmit,
    clearDraft,
  };
}
