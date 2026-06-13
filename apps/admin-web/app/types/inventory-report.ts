import type { InventoryTableMeta } from '~/types/inventory';

export type InventoryMovementRow = {
  id: string;
  productName: string;
  unit: string;
  openingQuantity: number;
  addedQuantity: number;
  deductedQuantity: number;
  closingQuantity: number;
  isLowStock: boolean;
};

export type InventoryMovementSummary = {
  totalOpeningQuantity: number;
  totalAddedQuantity: number;
  totalDeductedQuantity: number;
  totalClosingQuantity: number;
  totalProducts: number;
  totalLowStockItems: number;
};

export type InventoryMovementListResult = {
  rows: InventoryMovementRow[];
  meta: InventoryTableMeta;
  summary: InventoryMovementSummary;
};
