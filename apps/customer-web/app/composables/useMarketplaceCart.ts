import { toast } from '@gosource/ui';
import type { MarketCartItem, MarketCartMutationResponse, MarketProduct } from '~/lib/marketplace-data';
import {
  CART_LINE_UNIT_SEP,
  cartLineKey,
  defaultUnitForProduct,
  getMarketProductById,
  getMarketUnitPrice,
  isCartLineInStock,
  isMarketProductInStock,
  parseCartLineKey,
  registerMarketProduct,
} from '~/lib/marketplace-data';

export type SetCartQuantityOptions = {
  silent?: boolean;
  product?: MarketProduct;
};

export type CartLineMutationDirection = 'increase' | 'decrease';

type CartLineMutationPending = {
  lineKey: string;
  direction: CartLineMutationDirection;
};
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useGuestCartSync } from '~/composables/useGuestCartSync';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import {
  cartItemsToGuestStoredLines,
  clearGuestCartStorage,
  guestStoredLinesToCartItems,
  getGuestCartSnapshot,
  readGuestCartFromStorage,
  writeGuestCartToStorage,
} from '~/lib/guest-market-cart';
import { useCustomerMarketService } from '~/services/market.service';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

function isProductOutOfStockError(error: unknown): boolean {
  return /out of stock/i.test(extractApiErrorMessage(error, ''));
}

export type CartLine = MarketCartItem & {
  lineKey: string;
};

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hasPersistedCartId(cartId: string | undefined): cartId is string {
  return Boolean(cartId && !cartId.includes(CART_LINE_UNIT_SEP));
}

/** Reuses one toast so rapid +/- clicks do not stack multiple notifications. */
const MARKET_CART_MUTATION_TOAST_ID = 'marketplace-cart-mutation';

function toastCartMutation(message: string) {
  toast.success(message, { id: MARKET_CART_MUTATION_TOAST_ID });
}

function toastCartSuccess(response: MarketCartMutationResponse, fallback: string) {
  toastCartMutation(extractApiResponseMessage(response, fallback));
}

export function useMarketplaceCart() {
  const route = useRoute();
  const rawLines = useState<MarketCartItem[]>('marketplace-cart-lines', () => []);
  const cartTotalNaira = useState('marketplace-cart-total-naira', () => 0);
  const loading = useState('marketplace-cart-loading', () => false);
  const lineMutationPending = useState<CartLineMutationPending | null>(
    'marketplace-cart-line-mutation-pending',
    () => null,
  );
  const initializedBranchId = useState<string | null>('marketplace-cart-initialized-branch-id', () => null);
  const autoLoadStarted = useState('marketplace-cart-auto-load-started', () => false);
  const cartLifecycleHooksRegistered = useState('marketplace-cart-lifecycle-hooks', () => false);
  const guestCartMergeInFlight = useState('marketplace-guest-cart-merge-in-flight', () => false);
  const unbranchedCartMigrationInFlight = useState('marketplace-unbranched-cart-migration-in-flight', () => false);
  const cartLoadInFlight = useState<Promise<void> | null>('marketplace-cart-load-in-flight', () => null);
  const cartLoadQueuedForce = useState('marketplace-cart-load-queued-force', () => false);
  const { hasSession, sessionResolved, whenReady } = useCustomerSession();
  const {
    activeBranchId,
    branchFetchInitialized,
    ensureBranchForAction,
    fetchBranchesInBackground,
  } = useMarketBranchGate();
  const { syncing, syncGuestCartToServer } = useGuestCartSync();
  const marketService = useCustomerMarketService();
  const requestAddMode = useRequestAddItemsMode();
  /** Anonymous browsing uses local guest cart — never branch-gated. */
  const isGuestCartMode = computed(() => import.meta.client && !hasSession.value);

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
    const snapshot = getGuestCartSnapshot(rawLines.value);
    const items = guestStoredLinesToCartItems(snapshot);
    const total = items.reduce((sum, line) => sum + line.lineTotalNaira, 0);
    applyCart(items, total);
    initializedBranchId.value = 'guest';
  }

  function persistGuestCartFromState() {
    if (!isGuestCartMode.value) {
      return;
    }

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

  async function waitForGuestCartMerge() {
    if (!guestCartMergeInFlight.value) {
      return;
    }

    await new Promise<void>((resolve) => {
      const stop = watch(guestCartMergeInFlight, (inFlight) => {
        if (!inFlight) {
          stop();
          resolve();
        }
      });
    });
  }

  async function waitForUnbranchedCartMigration() {
    if (!unbranchedCartMigrationInFlight.value) {
      return;
    }

    await new Promise<void>((resolve) => {
      const stop = watch(unbranchedCartMigrationInFlight, (inFlight) => {
        if (!inFlight) {
          stop();
          resolve();
        }
      });
    });
  }

  function shouldMergeGuestCartAfterLogin() {
    return (
      hasPendingGuestCart() ||
      (initializedBranchId.value === 'guest' && rawLines.value.some((line) => line.quantity > 0))
    );
  }

  async function ensureGuestCartSyncedBeforeServerLoad() {
    if (!import.meta.client) {
      return;
    }

    // Only merge a pre-login guest cart from storage — not stale in-memory server lines.
    const pendingFromStorage = readGuestCartFromStorage();
    if (!pendingFromStorage.length) {
      await waitForGuestCartSync();
      return;
    }

    await syncGuestCartToServer({ lines: pendingFromStorage });
    await waitForGuestCartSync();
  }

  function resetCartState() {
    applyCart([], 0);
    initializedBranchId.value = null;
    clearGuestCartStorage();
  }

  function hasPendingGuestCart(): boolean {
    return readGuestCartFromStorage().length > 0;
  }

  /** Merge guest local cart into the logged-in server cart, then reload from API. */
  async function mergeGuestCartAfterLogin(): Promise<boolean> {
    if (!import.meta.client || !hasSession.value) {
      return false;
    }

    if (guestCartMergeInFlight.value) {
      await waitForGuestCartMerge();
      return true;
    }

    guestCartMergeInFlight.value = true;

    try {
      await whenReady();

      const pendingFromStorage = readGuestCartFromStorage();
      if (!pendingFromStorage.length) {
        await loadCart(true);
        return true;
      }

      const synced = await syncGuestCartToServer({ lines: pendingFromStorage });
      await loadCart(true);
      return synced;
    } finally {
      guestCartMergeInFlight.value = false;
    }
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
      await mergeGuestCartAfterLogin();
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

  /** Move pre-branch cart lines onto the new branch so they are not lost after create-branch. */
  async function migrateUnbranchedCartToBranch(branchId: string) {
    if (!import.meta.client || !branchId || isGuestCartMode.value) {
      return;
    }

    if (unbranchedCartMigrationInFlight.value) {
      await waitForUnbranchedCartMigration();
      return;
    }

    unbranchedCartMigrationInFlight.value = true;

    try {
      const allResponse = await marketService.getCart('all');
      const allItems = allResponse.data.cartItems ?? [];
      const unbranched = allItems.filter((item) => !item.branchId);

      if (!unbranched.length) {
        return;
      }

      for (const line of unbranched) {
        const existingOnBranch = allItems.find(
          (item) =>
            item.branchId === branchId &&
            item.productId === line.productId &&
            item.unit === line.unit,
        );

        try {
          if (existingOnBranch && hasPersistedCartId(existingOnBranch.id)) {
            const mergedQty = Math.min(999, existingOnBranch.quantity + line.quantity);
            if (mergedQty !== existingOnBranch.quantity) {
              await marketService.updateCartItemQuantity(existingOnBranch.id, mergedQty);
            }
          } else {
            await marketService.addCartItem(
              {
                productId: line.productId,
                branchId,
                unit: line.unit,
                quantity: line.quantity,
              },
              { quiet: true },
            );
          }

          if (hasPersistedCartId(line.id)) {
            await marketService.removeCartItem(line.id);
          }
        } catch {
          // Best-effort per line; reload cart after loop.
        }
      }
    } catch {
      // Ignore migration errors; loadCart will still run.
    } finally {
      unbranchedCartMigrationInFlight.value = false;
    }
  }

  async function ensureUnbranchedCartMigrated(branchId?: string | null) {
    const targetBranchId = branchId ?? activeBranchId.value;
    if (!targetBranchId || isGuestCartMode.value) {
      return;
    }

    await migrateUnbranchedCartToBranch(targetBranchId);
  }

  /** Reload server cart for logged-in users (guest merge first when localStorage has items). */
  async function refreshLoggedInCart() {
    await waitForGuestCartMerge();
    await waitForGuestCartSync();
    await waitForUnbranchedCartMigration();

    if (!import.meta.client || isGuestCartMode.value || !hasSession.value) {
      return;
    }

    if (shouldMergeGuestCartAfterLogin()) {
      await mergeGuestCartAfterLogin();
      return;
    }

    await loadCart(true);
  }

  /** Hydrate guest local cart or refresh logged-in server cart on market entry. */
  function syncMarketCartEntry() {
    if (!import.meta.client) {
      return;
    }

    if (isGuestCartMode.value) {
      loadGuestCartToState();
      return;
    }

    if (hasSession.value) {
      void refreshLoggedInCart();
    }
  }

  async function loadCart(force = false) {
    if (isGuestCartMode.value) {
      if (force && rawLines.value.length && initializedBranchId.value === 'guest') {
        persistGuestCartFromState();
        return;
      }

      loadGuestCartToState();
      return;
    }

    if (cartLoadInFlight.value) {
      cartLoadQueuedForce.value = cartLoadQueuedForce.value || force;
      await cartLoadInFlight.value;
      const queuedForce = cartLoadQueuedForce.value;
      cartLoadQueuedForce.value = false;
      if (!queuedForce) {
        return;
      }
      force = true;
    }

    const run = async () => {
      if (force) {
        await waitForGuestCartSync();
      } else {
        await ensureGuestCartSyncedBeforeServerLoad();
      }

      loading.value = true;

      try {
        const branchId = await getBranchIdForCartAction(false);

        if (branchId) {
          await ensureUnbranchedCartMigrated(branchId);
        }

        const cartScopeId = branchId || 'all';

        if (!force && initializedBranchId.value === cartScopeId) {
          return;
        }

        const response = await marketService.getCart(cartScopeId);
        applyCart(response.data.cartItems ?? [], response.data.totalPrice ?? 0);
        initializedBranchId.value = cartScopeId;
      } finally {
        loading.value = false;
      }
    };

    cartLoadInFlight.value = run();

    try {
      await cartLoadInFlight.value;
    } finally {
      cartLoadInFlight.value = null;
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

  function setLineMutationPending(
    productId: string,
    unit: string,
    direction: CartLineMutationDirection | null,
  ) {
    if (!direction) {
      lineMutationPending.value = null;
      return;
    }

    lineMutationPending.value = {
      lineKey: cartLineKey(productId, unit),
      direction,
    };
  }

  function getLineMutationPending(
    productId: string,
    unit: string,
  ): CartLineMutationDirection | null {
    const pending = lineMutationPending.value;
    if (!pending || pending.lineKey !== cartLineKey(productId, unit)) {
      return null;
    }

    return pending.direction;
  }

  async function setCartQuantityForUnit(
    productId: string,
    unit: string,
    raw: number,
    options?: SetCartQuantityOptions,
  ) {
    const next = Math.max(0, Math.min(999, Math.floor(Number.isFinite(raw) ? raw : 0)));
    const existing = findLine(productId, unit);
    const previousQty = existing?.quantity ?? 0;
    const mutationDirection: CartLineMutationDirection | null =
      next > previousQty ? 'increase' : next < previousQty ? 'decrease' : null;

    if (isGuestCartMode.value) {
      if (mutationDirection) {
        setLineMutationPending(productId, unit, mutationDirection);
      }

      try {
      const product =
        existing?.product ?? options?.product ?? getMarketProductById(productId);
      if (!product) {
        if (!options?.silent) {
          toast.error('Unable to add this product. Please refresh and try again.');
        }
        return false;
      }

      if (next > 0 && !isMarketProductInStock(product)) {
        if (!options?.silent) {
          toast.error(`${product.name} is out of stock.`);
        }
        return false;
      }

      registerMarketProduct(product);

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
          toastCartMutation('Added to cart');
        } else if (existing && next > previousQty) {
          toastCartMutation('Quantity increased');
        } else if (existing && next < previousQty && next > 0) {
          toastCartMutation('Quantity decreased');
        } else if (next <= 0) {
          toastCartMutation('Removed from cart');
        }
      }

      return next > 0;
      } finally {
        if (mutationDirection) {
          setLineMutationPending(productId, unit, null);
        }
      }
    }

    // Legacy API allows cart lines without a branch until checkout (gosource-web-app parity).
    const branchId = await getBranchIdForCartAction(false);
    const persistedCartId = hasPersistedCartId(existing?.id) ? existing.id : null;

    if (mutationDirection) {
      setLineMutationPending(productId, unit, mutationDirection);
    }

    try {
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
      if (existing && !isCartLineInStock(existing)) {
        toast.error(
          `${existing.product?.name ?? 'This product'} is out of stock. Remove it from your cart to continue.`,
        );
        return false;
      }
      if (product && !isMarketProductInStock(product)) {
        toast.error(`${product.name} is out of stock.`);
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
      if (isProductOutOfStockError(error)) {
        return false;
      }
      throw error;
    } finally {
      if (mutationDirection) {
        setLineMutationPending(productId, unit, null);
      }
    }
  }

  async function setQuantityForUnit(
    productId: string,
    unit: string,
    raw: number,
    options?: SetCartQuantityOptions,
  ) {
    if (requestAddMode.isAddingToRequest.value) {
      return requestAddMode.setQuantityForUnit(productId, unit, raw);
    }

    return setCartQuantityForUnit(productId, unit, raw, options);
  }

  function setQuantity(productId: string, raw: number, options?: SetCartQuantityOptions) {
    const product = options?.product ?? getMarketProductById(productId);
    const unit = product ? defaultUnitForProduct(product) : 'Standard pack';
    return setQuantityForUnit(productId, unit, raw, options);
  }

  async function addOne(productId: string, unit?: string, options?: SetCartQuantityOptions) {
    const product = options?.product ?? getMarketProductById(productId);
    const resolvedUnit = unit ?? (product ? defaultUnitForProduct(product) : 'Standard pack');
    const current = getQtyForUnit(productId, resolvedUnit);
    return await setQuantityForUnit(productId, resolvedUnit, current + 1, options);
  }

  function increment(productId: string, unit?: string, options?: SetCartQuantityOptions) {
    return addOne(productId, unit, options);
  }

  function decrement(productId: string, unit?: string, options?: SetCartQuantityOptions) {
    const product = options?.product ?? getMarketProductById(productId);
    const resolvedUnit = unit ?? (product ? defaultUnitForProduct(product) : 'Standard pack');
    const current = getQtyForUnit(productId, resolvedUnit);
    return setQuantityForUnit(productId, resolvedUnit, current - 1, options);
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

  /** Clears local cart and server cart without reloading (e.g. after request creation). */
  async function clearCartAfterRequest(branchId: string) {
    resetCartState();
    if (isGuestCartMode.value) {
      return;
    }

    try {
      await marketService.clearCart(branchId);
    } catch {
      // Request already created; avoid surfacing cart cleanup failures in checkout flow.
    }
  }

  if (import.meta.client && !autoLoadStarted.value) {
    autoLoadStarted.value = true;
    onMounted(() => {
      if (!requestAddMode.isAddingToRequest.value) {
        void initializeCart();
      }
    });
  }

  if (import.meta.client && !cartLifecycleHooksRegistered.value) {
    cartLifecycleHooksRegistered.value = true;

    watch(activeBranchId, (branchId, previousBranchId) => {
      if (requestAddMode.isAddingToRequest.value || isGuestCartMode.value) {
        return;
      }

      if (branchId && branchId !== previousBranchId) {
        void refreshLoggedInCart();
      }
    });

    watch(hasSession, (nextHasSession, previousHasSession) => {
      if (requestAddMode.isAddingToRequest.value) {
        return;
      }

      if (nextHasSession && !previousHasSession) {
        if (initializedBranchId.value === 'guest') {
          initializedBranchId.value = null;
        }
        void (async () => {
          await mergeGuestCartAfterLogin();
        })();
        return;
      }

      if (!nextHasSession && previousHasSession) {
        resetCartState();
      }
    });

    // Users without a branch never get activeBranchId; reload after branch list settles.
    watch(
      [branchFetchInitialized, hasSession, activeBranchId] as const,
      ([ready, signedIn, branchId]) => {
        if (
          !ready ||
          !signedIn ||
          branchId ||
          isGuestCartMode.value ||
          requestAddMode.isAddingToRequest.value
        ) {
          return;
        }

        void refreshLoggedInCart();
      },
      { immediate: true },
    );

    function refreshCartForMarketRoute() {
      if (!route.path.startsWith('/market')) {
        return;
      }

      if (requestAddMode.isAddingToRequest.value) {
        return;
      }

      syncMarketCartEntry();
    }

    watch(
      [isGuestCartMode, () => route.path] as const,
      ([guest, path]) => {
        if (guest && path.startsWith('/market') && !requestAddMode.isAddingToRequest.value) {
          loadGuestCartToState();
        }
      },
      { immediate: true },
    );

    watch(() => route.path, refreshCartForMarketRoute, { immediate: true });

    onActivated(refreshCartForMarketRoute);
  }

  return {
    isGuestCartMode,
    qtyByLineKey,
    lines,
    loading,
    totalItemCount,
    subtotalNaira,
    initializeCart,
    mergeGuestCartAfterLogin,
    refreshLoggedInCart,
    syncMarketCartEntry,
    hasPendingGuestCart,
    loadCart,
    resetCartState,
    flushGuestCartToStorage,
    clearCart,
    clearCartAfterRequest,
    getCartQtyForUnit,
    getQtyForUnit,
    getTotalQtyForProduct,
    getQty,
    getLineMutationPending,
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
