export type LowStockProduct = {
  trackQuantity?: boolean;
  quantity?: number;
  lowStockLevel?: number | null;
  isLowStock?: boolean;
};

export function computeIsLowStock(product: LowStockProduct): boolean {
  if (product.trackQuantity === false) {
    return false;
  }

  if (product.lowStockLevel == null) {
    return false;
  }

  const quantity = Number(product.quantity ?? 0);
  const level = Number(product.lowStockLevel);

  if (!Number.isFinite(quantity) || !Number.isFinite(level)) {
    return false;
  }

  return quantity <= level;
}

export function buildLowStockPatch(
  product: LowStockProduct,
): { isLowStock: boolean } | null {
  const computed = computeIsLowStock(product);

  if (product.isLowStock === computed) {
    return null;
  }

  return { isLowStock: computed };
}
