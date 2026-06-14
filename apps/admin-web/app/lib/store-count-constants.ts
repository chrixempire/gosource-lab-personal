import type { StoreCountRowStatus } from '~/types/store-count';

export const STORE_COUNT_DRAFT_STORAGE_KEY = 'admin-store-count-draft';

export const STORE_COUNT_ROW_STATUS_LABELS: Record<StoreCountRowStatus, string> = {
  uncounted: 'Uncounted',
  matched: 'Matched',
  shortage: 'Shortage',
  overrange: 'Overrange',
};

export function resolveStoreCountRowStatus(
  countedQuantity: number,
  quantityLeft: number,
): StoreCountRowStatus {
  if (!countedQuantity || countedQuantity <= 0) {
    return 'uncounted';
  }
  if (countedQuantity < quantityLeft) {
    return 'shortage';
  }
  if (countedQuantity === quantityLeft) {
    return 'matched';
  }
  return 'overrange';
}

export function storeCountStatusVariant(
  status: StoreCountRowStatus,
): 'success' | 'negative' | 'warning' | 'default' {
  switch (status) {
    case 'matched':
      return 'success';
    case 'shortage':
      return 'negative';
    case 'overrange':
      return 'warning';
    default:
      return 'default';
  }
}
