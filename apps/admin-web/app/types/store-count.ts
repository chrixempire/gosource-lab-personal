import type { InventoryTableMeta } from '~/types/inventory';

export type StoreCountRowStatus = 'uncounted' | 'matched' | 'shortage' | 'overrange';

export type StoreCountProductRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  marketPrice: number;
  quantityLeft: number;
  unit: string;
  countedQuantity: number;
  status: StoreCountRowStatus;
};

export type StoreCountHistoryItem = {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  createdTimeLabel: string;
  initiatorName: string;
  productCount: number;
};

export type StoreCountSubmitPayload = {
  notes?: string;
  countedProducts: Array<{
    productId: string;
    countedQuantity: number;
  }>;
};

export type StoreCountHistoryListResult = {
  rows: StoreCountHistoryItem[];
  meta: InventoryTableMeta;
};

export type StoreCountDetail = StoreCountHistoryItem & {
  rows: StoreCountProductRow[];
};
