import { toast } from '@gosource/ui';
import type { MarketCartItem, MarketCartMutationResponse } from '~/lib/marketplace-data';
import {
  CART_LINE_UNIT_SEP,
  cartLineKey,
  defaultUnitForProduct,
  getMarketProductById,
  getMarketUnitPrice,
  isMarketProductInStock,
  parseCartLineKey,
} from '~/lib/marketplace-data';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import { useCustomerMarketService } from '~/services/market.service';
import { extractApiResponseMessage } from '~/utils/api-error';

export type CartLine = MarketCartItem & {
  lineKey: string;
};

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hasPersistedCartId(cartId: string | undefined): cartId is string {
  return Boolean(cartId && !cartId.includes(CART_LINE_UNIT_SEP));
}

function toastCartSuccess(response: MarketCartMutationResponse, fallback: string) {
  toast.success(extractApiResponseMessage(response, fallback));
}

export function useMarketplaceCart() {
  const rawLines = useState<MarketCartItem[]>('marketplace-cart-lines', () => []);
  const cartTotalNaira = useState('marketplace-cart-total-naira', () => 0);
  const loading = useState('marketplace-cart-loading', () => false);
  const initializedBranchId = useState<string | null>('marketplace-cart-initialized-branch-id', () => null);
  const autoLoadStarted = useState('marketplace-cart-auto-load-started', () => false);
  const {
    activeBranchId,
    ensureBranchForAction,
    fetchBranchesInBackground,
    hasSession,
  } = useMarketBranchGate();
  const marketService = useCustomerMarketService();
  const requestAddMode = useRequestAddItemsMode();

  const lines = computed<CartLine[]>(() =>
    rawLines.value
      .filter((line) => line.quantity > 0)
      .map((line) => ({
        ...line,
        lineKey: cartLineKey(line.productId, line.unit),
      })),
  );

  const qtyByLineKey = computed<Record<string, number>>(() =>
    Object.fromEntries(lines.value.map((line) => [line.lineKey, line.quantity])),
  );

  const totalItemCount = computed(() => {
    if (requestAddMode.isAddingToRequest.value) {
      return requestAddMode.totalItemCount.value;
    }

    return lines.value.reduce((sum, line) => sum + line.quantity, 0);
  });

  const subtotalNaira = computed(() => {
    const computedTotal = lines.value.reduce((sum, line) => {
      const product = line.product ?? getMarketProductById(line.productId);
      if (!product) {
        return sum + line.lineTotalNaira;
      }
      return sum + getMarketUnitPrice(product, line.unit) * line.quantity;
    }, 0);

    return computedTotal || cartTotalNaira.value;
  });

  function applyCart(items: MarketCartItem[], totalPrice: number) {
    rawLines.value = items;
    cartTotalNaira.value = totalPrice;
  }

  async function getBranchIdForCartAction(openGate = true) {
    if (!activeBranchId.value) {
      await fetchBranchesInBackground(true);
    }

    if (!activeBranchId.value && openGate) {
      await ensureBranchForAction();
      if (!activeBranchId.value) {
        await fetchBranchesInBackground(true);
      }
    }

    return activeBranchId.value;
  }

  async function loadCart(force = false) {
    if (loading.value) {
      return;
    }

    loading.value = true;
    const branchId = await getBranchIdForCartAction(false);
    const cartScopeId = branchId || 'all';

    if (!force && initializedBranchId.value === cartScopeId) {
      loading.value = false;
      return;
    }

    try {
      const response = await marketService.getCart(cartScopeId);
      applyCart(response.data.cartItems ?? [], response.data.totalPrice ?? 0);
      initializedBranchId.value = cartScopeId;
    } finally {
      loading.value = false;
    }
  }

  function findLine(productId: string, unit: string) {
    return lines.value.find((line) => line.productId === productId && line.unit === unit);
  }

  function replaceOptimisticLine(nextLine: MarketCartItem) {
    const idx = rawLines.value.findIndex(
      (line) => line.productId === nextLine.productId && line.unit === nextLine.unit,
    );
    if (idx === -1) {
      rawLines.value = [...rawLines.value, nextLine];
      return;
    }
    const copy = [...rawLines.value];
    copy[idx] = nextLine;
    rawLines.value = copy;
  }

  function removeOptimisticLine(productId: string, unit: string) {
    rawLines.value = rawLines.value.filter((line) => !(line.productId === productId && line.unit === unit));
  }

  function getCartQtyForUnit(productId: string, unit: string): number {
    return findLine(productId, unit)?.quantity ?? 0;
  }

  function getQtyForUnit(productId: string, unit: string): number {
    if (requestAddMode.isAddingToRequest.value) {
      return requestAddMode.getQtyForUnit(productId, unit);
    }

    return getCartQtyForUnit(productId, unit);
  }

  function getTotalQtyForProduct(productId: string): number {
    if (requestAddMode.isAddingToRequest.value) {
      return requestAddMode.getTotalQtyForProduct(productId);
    }

    return lines.value.filter((line) => line.productId === productId).reduce((sum, line) => sum + line.quantity, 0);
  }

  function getQty(productId: string): number {
    return getTotalQtyForProduct(productId);
  }

  async function setCartQuantityForUnit(
    productId: string,
    unit: string,
    raw: number,
    options?: { silent?: boolean },
  ) {
    const branchId = await getBranchIdForCartAction();
    const next = Math.max(0, Math.min(999, Math.floor(Number.isFinite(raw) ? raw : 0)));
    const existing = findLine(productId, unit);
    const persistedCartId = hasPersistedCartId(existing?.id) ? existing.id : null;
    const previousQty = existing?.quantity ?? 0;

    if (next <= 0) {
      if (existing) {
        removeOptimisticLine(productId, unit);
        try {
          if (persistedCartId) {
            const response = await marketService.removeCartItem(persistedCartId);
            await loadCart(true);
            toastCartSuccess(response, 'Removed from cart');
          } else {
            await loadCart(true);
          }
        } catch (error) {
          await loadCart(true);
          throw error;
        }
      }
      return false;
    }

    const product = existing?.product ?? getMarketProductById(productId);
    if (product && !isMarketProductInStock(product)) {
      return false;
    }
    replaceOptimisticLine({
      id: existing?.id ?? cartLineKey(productId, unit),
      productId,
      branchId: branchId || undefined,
      unit,
      quantity: next,
      product,
      lineTotalNaira: product ? getMarketUnitPrice(product, unit) * next : existing?.lineTotalNaira ?? 0,
    });

    try {
      let response: MarketCartMutationResponse;
      if (persistedCartId) {
        response = await marketService.updateCartItemQuantity(persistedCartId, next);
      } else {
        response = await marketService.addCartItem({
          productId,
          ...(branchId ? { branchId } : {}),
          unit,
          quantity: next,
        });
      }
      await loadCart(true);

      if (!options?.silent) {
        if (!existing) {
          toastCartSuccess(response, 'Added to cart');
        } else if (next > previousQty) {
          toastCartSuccess(response, 'Quantity increased');
        } else if (next < previousQty) {
          toastCartSuccess(response, 'Quantity decreased');
        }
      }

      return true;
    } catch (error) {
      await loadCart(true);
      throw error;
    }
  }

  async function setQuantityForUnit(productId: string, unit: string, raw: number) {
    if (requestAddMode.isAddingToRequest.value) {
      return requestAddMode.setQuantityForUnit(productId, unit, raw);
    }

    return setCartQuantityForUnit(productId, unit, raw);
  }

  function setQuantity(productId: string, raw: number) {
    const product = getMarketProductById(productId);
    const unit = product ? defaultUnitForProduct(product) : 'Standard pack';
    return setQuantityForUnit(productId, unit, raw);
  }

  async function addOne(productId: string, unit?: string) {
    const product = getMarketProductById(productId);
    const resolvedUnit = unit ?? (product ? defaultUnitForProduct(product) : 'Standard pack');
    const current = getQtyForUnit(productId, resolvedUnit);
    return await setQuantityForUnit(productId, resolvedUnit, current + 1);
  }

  function increment(productId: string, unit?: string) {
    return addOne(productId, unit);
  }

  function decrement(productId: string, unit?: string) {
    const product = getMarketProductById(productId);
    const resolvedUnit = unit ?? (product ? defaultUnitForProduct(product) : 'Standard pack');
    const current = getQtyForUnit(productId, resolvedUnit);
    return setQuantityForUnit(productId, resolvedUnit, current - 1);
  }

  async function removeLine(lineKey: string) {
    const parsed = parseCartLineKey(lineKey);
    if (!parsed) {
      return;
    }

    await setQuantityForUnit(parsed.productId, parsed.unit, 0);
  }

  function remove(productId: string, unit?: string) {
    if (unit !== undefined) {
      return setQuantityForUnit(productId, unit, 0);
    }

    return Promise.all(
      lines.value
        .filter((item) => item.productId === productId)
        .map((line) => setQuantityForUnit(line.productId, line.unit, 0)),
    ).then(() => undefined);
  }

  function incrementLine(lineKey: string) {
    const parsed = parseCartLineKey(lineKey);
    if (!parsed) {
      return Promise.resolve();
    }
    return increment(parsed.productId, parsed.unit);
  }

  function decrementLine(lineKey: string) {
    const parsed = parseCartLineKey(lineKey);
    if (!parsed) {
      return Promise.resolve();
    }
    return decrement(parsed.productId, parsed.unit);
  }

  async function clearCart() {
    const branchId = await getBranchIdForCartAction();
    if (!branchId) {
      return;
    }

    applyCart([], 0);
    try {
      await marketService.clearCart(branchId);
      await loadCart(true);
    } catch (error) {
      await loadCart(true);
      throw error;
    }
  }

  if (import.meta.client && !autoLoadStarted.value) {
    autoLoadStarted.value = true;
    onMounted(() => {
      if (!requestAddMode.isAddingToRequest.value) {
        void loadCart();
      }
    });

    watch(activeBranchId, (branchId, previousBranchId) => {
      if (requestAddMode.isAddingToRequest.value) {
        return;
      }

      if (branchId && branchId !== previousBranchId) {
        void loadCart(true);
      }
    });

    watch(hasSession, (nextHasSession) => {
      if (requestAddMode.isAddingToRequest.value) {
        return;
      }

      if (nextHasSession) {
        void loadCart(true);
      }
    });
  }

  return {
    qtyByLineKey,
    lines,
    loading,
    totalItemCount,
    subtotalNaira,
    loadCart,
    clearCart,
    getCartQtyForUnit,
    getQtyForUnit,
    getTotalQtyForProduct,
    getQty,
    setCartQuantityForUnit,
    setQuantityForUnit,
    setQuantity,
    addOne,
    increment,
    decrement,
    incrementLine,
    decrementLine,
    remove,
    removeLine,
    cartLineKey,
    parseCartLineKey,
  };
}
