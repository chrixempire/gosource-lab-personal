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
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useGuestCartSync } from '~/composables/useGuestCartSync';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import {
  cartItemsToGuestStoredLines,
  guestStoredLinesToCartItems,
  getGuestCartSnapshot,
  readGuestCartFromStorage,
  writeGuestCartToStorage,
} from '~/lib/guest-market-cart';
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
  const { hasSession, sessionResolved, whenReady } = useCustomerSession();
  const {
    activeBranchId,
    ensureBranchForAction,
    fetchBranchesInBackground,
  } = useMarketBranchGate();
  const { syncing, syncGuestCartToServer } = useGuestCartSync();
  const marketService = useCustomerMarketService();
  const requestAddMode = useRequestAddItemsMode();
  const isGuestCartMode = computed(
    () => import.meta.client && sessionResolved.value && !hasSession.value,
  );

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

  function loadGuestCartToState() {
    const stored = readGuestCartFromStorage();
    const items = guestStoredLinesToCartItems(stored);
    const total = items.reduce((sum, line) => sum + line.lineTotalNaira, 0);
    applyCart(items, total);
    initializedBranchId.value = 'guest';
  }

  function persistGuestCartFromState() {
    writeGuestCartToStorage(cartItemsToGuestStoredLines(rawLines.value));
    cartTotalNaira.value = subtotalNaira.value;
  }

  function flushGuestCartToStorage() {
    if (isGuestCartMode.value) {
      persistGuestCartFromState();
    }
  }

  async function waitForGuestCartSync() {
    if (!syncing.value) {
      return;
    }

    await new Promise<void>((resolve) => {
      const stop = watch(syncing, (inFlight) => {
        if (!inFlight) {
          stop();
          resolve();
        }
      });
    });
  }

  async function ensureGuestCartSyncedBeforeServerLoad() {
    if (!import.meta.client) {
      return;
    }

    const pending = getGuestCartSnapshot(rawLines.value);
    if (!pending.length) {
      await waitForGuestCartSync();
      return;
    }

    await syncGuestCartToServer();
    await waitForGuestCartSync();
  }

  async function initializeCart() {
    if (import.meta.client) {
      await whenReady();
    }

    if (isGuestCartMode.value) {
      loadGuestCartToState();
      return;
    }

    if (hasSession.value) {
      await syncGuestCartToServer();
      await loadCart(true);
    }
  }

  async function getBranchIdForCartAction(openGate = true) {
    if (isGuestCartMode.value) {
      return null;
    }
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
    if (isGuestCartMode.value) {
      if (force && rawLines.value.length) {
        persistGuestCartFromState();
        return;
      }

      loadGuestCartToState();
      return;
    }

    await ensureGuestCartSyncedBeforeServerLoad();

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
    const next = Math.max(0, Math.min(999, Math.floor(Number.isFinite(raw) ? raw : 0)));
    const existing = findLine(productId, unit);
    const previousQty = existing?.quantity ?? 0;

    if (isGuestCartMode.value) {
      const product = existing?.product ?? getMarketProductById(productId);
      if (!product) {
        return false;
      }

      if (next > 0 && !isMarketProductInStock(product)) {
        return false;
      }

      if (next <= 0) {
        removeOptimisticLine(productId, unit);
      } else {
        replaceOptimisticLine({
          id: cartLineKey(productId, unit),
          productId,
          unit,
          quantity: next,
          product,
          lineTotalNaira: getMarketUnitPrice(product, unit) * next,
        });
      }

      persistGuestCartFromState();

      if (!options?.silent) {
        if (!existing && next > 0) {
          toast.success('Added to cart');
        } else if (existing && next > previousQty) {
          toast.success('Quantity increased');
        } else if (existing && next < previousQty && next > 0) {
          toast.success('Quantity decreased');
        } else if (next <= 0) {
          toast.success('Removed from cart');
        }
      }

      return next > 0;
    }

    const branchId = await getBranchIdForCartAction();
    const persistedCartId = hasPersistedCartId(existing?.id) ? existing.id : null;

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
    if (isGuestCartMode.value) {
      applyCart([], 0);
      persistGuestCartFromState();
      return;
    }

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
        void initializeCart();
      }
    });

    watch(activeBranchId, (branchId, previousBranchId) => {
      if (requestAddMode.isAddingToRequest.value || isGuestCartMode.value) {
        return;
      }

      if (branchId && branchId !== previousBranchId) {
        void (async () => {
          if (readGuestCartFromStorage().length) {
            await syncGuestCartToServer();
          }
          await loadCart(true);
        })();
      }
    });

    watch(hasSession, (nextHasSession, previousHasSession) => {
      if (requestAddMode.isAddingToRequest.value) {
        return;
      }

      if (nextHasSession && !previousHasSession) {
        void (async () => {
          persistGuestCartFromState();
          await syncGuestCartToServer();
          await loadCart(true);
        })();
        return;
      }

      if (!nextHasSession && previousHasSession) {
        loadGuestCartToState();
      }
    });
  }

  return {
    isGuestCartMode,
    qtyByLineKey,
    lines,
    loading,
    totalItemCount,
    subtotalNaira,
    initializeCart,
    loadCart,
    flushGuestCartToStorage,
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
