import { toast } from '@gosource/ui';
import type { MarketCartItem } from '~/lib/marketplace-data';
import { CART_LINE_UNIT_SEP } from '~/lib/marketplace-data';
import {
  clearGuestCartStorage,
  getGuestCartSnapshot,
  readGuestCartFromStorage,
  writeGuestCartToStorage,
  type GuestCartStoredLine,
} from '~/lib/guest-market-cart';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useCustomerMarketService } from '~/services/market.service';
import { extractApiErrorMessage } from '~/utils/api-error';

function hasServerCartId(cartId: string | undefined): cartId is string {
  return Boolean(cartId && !cartId.includes(CART_LINE_UNIT_SEP));
}

export function useGuestCartSync() {
  const syncing = useState('guest-cart-sync-in-flight', () => false);
  const rawLines = useState<MarketCartItem[]>('marketplace-cart-lines', () => []);
  const { activeBranchId, fetchBranchesInBackground } = useMarketBranchGate();
  const marketService = useCustomerMarketService();

  async function syncGuestCartToServer(options?: {
    /** When set, only these lines are merged (e.g. guest localStorage after sign-in). */
    lines?: GuestCartStoredLine[];
  }): Promise<boolean> {
    if (!import.meta.client || syncing.value) {
      return false;
    }

    const snapshot = options?.lines ?? getGuestCartSnapshot(rawLines.value);
    if (!snapshot.length) {
      return true;
    }

    writeGuestCartToStorage(snapshot);

    let branchId = activeBranchId.value;
    if (!branchId) {
      await fetchBranchesInBackground(true);
      branchId = activeBranchId.value;
    }

    // Match gosource-web-app / legacy-api: cart lines can exist without a branch until checkout.
    const cartScopeId = branchId || 'all';

    syncing.value = true;

    try {
      const serverResponse = await marketService.getCart(cartScopeId);
      const serverItems = serverResponse.data.cartItems ?? [];

      let skippedOutOfStock = 0;

      for (const line of snapshot) {
        const existing = serverItems.find(
          (item) =>
            item.productId === line.productId &&
            item.unit === line.unit &&
            (branchId ? item.branchId === branchId : !item.branchId),
        );

        try {
          if (existing && hasServerCartId(existing.id)) {
            const mergedQty = Math.min(999, existing.quantity + line.quantity);
            if (mergedQty !== existing.quantity) {
              await marketService.updateCartItemQuantity(existing.id, mergedQty);
            }
            continue;
          }

          await marketService.addCartItem(
            {
              productId: line.productId,
              ...(branchId ? { branchId } : {}),
              unit: line.unit,
              quantity: line.quantity,
            },
            { quiet: true },
          );
        } catch (error) {
          const message = extractApiErrorMessage(error, '');
          if (/out of stock/i.test(message)) {
            skippedOutOfStock += 1;
            continue;
          }
          throw error;
        }
      }

      if (skippedOutOfStock > 0) {
        toast.error(
          skippedOutOfStock === 1
            ? 'One item in your cart is out of stock and was skipped.'
            : `${skippedOutOfStock} items in your cart are out of stock and were skipped.`,
        );
      }

      clearGuestCartStorage();
      return true;
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to move your cart to your account'));
      return false;
    } finally {
      syncing.value = false;
    }
  }

  return {
    syncing: readonly(syncing),
    syncGuestCartToServer,
    hasGuestCartInStorage: () => readGuestCartFromStorage().length > 0,
  };
}
