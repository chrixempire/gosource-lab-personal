export type ProductStockDialogTarget = {
  id: string;
  name: string;
  /** Raw `purchaseUnit` from the product (gosource-admin-v2 `quantity.unit`). */
  unit: string;
  marketPrice?: number;
};

export function useProductStockDialog() {
  const open = ref(false);
  const mode = ref<'add' | 'remove'>('add');
  const target = ref<ProductStockDialogTarget | null>(null);

  function openAddStock(product: ProductStockDialogTarget) {
    mode.value = 'add';
    target.value = product;
    open.value = true;
  }

  function openRemoveStock(product: ProductStockDialogTarget) {
    mode.value = 'remove';
    target.value = product;
    open.value = true;
  }

  function reset() {
    target.value = null;
  }

  watch(open, (value) => {
    if (!value) {
      // Defer clearing target so mounted dialog still has props during close.
      queueMicrotask(() => {
        if (!open.value) {
          reset();
        }
      });
    }
  });

  return {
    open,
    mode,
    target,
    openAddStock,
    openRemoveStock,
  };
}
