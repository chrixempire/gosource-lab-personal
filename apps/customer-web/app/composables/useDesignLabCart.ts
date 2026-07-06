/**
 * Local per-instance cart for a design-lab platform, keyed by product + unit so
 * the same product can be added in multiple units (e.g. a 50kg bag AND a 25kg
 * bag). Each platform component calls this once in setup.
 */
export function useDesignLabCart() {
  const entries = reactive<
    Record<string, { productId: string; unit: string; qty: number; priceNaira: number }>
  >({});

  const keyOf = (id: string, unit: string) => `${id}::${unit}`;

  function add(id: string, unit: string, price: number, n = 1) {
    const k = keyOf(id, unit);
    const next = Math.max(0, (entries[k]?.qty ?? 0) + n);
    if (next === 0) {
      delete entries[k];
      return;
    }
    entries[k] = { productId: id, unit, qty: next, priceNaira: price };
  }

  function setQty(id: string, unit: string, price: number, n: number) {
    const k = keyOf(id, unit);
    const q = Math.max(0, Math.round(Number.isFinite(n) ? n : 0));
    if (q === 0) {
      delete entries[k];
      return;
    }
    entries[k] = { productId: id, unit, qty: q, priceNaira: price };
  }

  /** Quantity of one specific unit of a product. */
  const qtyOf = (id: string, unit: string) => entries[keyOf(id, unit)]?.qty ?? 0;
  /** Total quantity of a product across all its units (for "in cart" state). */
  const qtyOfProduct = (id: string) =>
    Object.values(entries)
      .filter((e) => e.productId === id)
      .reduce((sum, e) => sum + e.qty, 0);
  /** The units of a product currently in the cart (for the modal summary). */
  const unitsInCart = (id: string) =>
    Object.values(entries).filter((e) => e.productId === id);

  const count = computed(() =>
    Object.values(entries).reduce((sum, e) => sum + e.qty, 0),
  );
  const total = computed(() =>
    Object.values(entries).reduce((sum, e) => sum + e.qty * e.priceNaira, 0),
  );
  /** Back-compat helper used by the cart bar; arg is ignored. */
  const totalFor = (_products?: unknown) => total.value;

  return { entries, add, setQty, qtyOf, qtyOfProduct, unitsInCart, count, total, totalFor };
}
