import { toast } from '@gosource/ui';
import type { MarketCartItem } from '~/lib/marketplace-data';
import { CART_LINE_UNIT_SEP } from '~/lib/marketplace-data';
import {
  clearGuestCartStorage,
  getGuestCartSnapshot,
  readGuestCartFromStorage,
  writeGuestCartToStorage,
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

  async function syncGuestCartToServer(): Promise<boolean> {
    if (!import.meta.client || syncing.value) {
      return false;
    }

    const snapshot = getGuestCartSnapshot(rawLines.value);
    if (!snapshot.length) {
      return true;
    }

    writeGuestCartToStorage(snapshot);

    let branchId = activeBranchId.value;
    if (!branchId) {
      await fetchBranchesInBackground(true);
      branchId = activeBranchId.value;
    }

    if (!branchId) {
      return false;
    }

    syncing.value = true;

    try {
      const serverResponse = await marketService.getCart(branchId);
      const serverItems = serverResponse.data.cartItems ?? [];

      for (const line of snapshot) {
        const existing = serverItems.find(
          (item) => item.productId === line.productId && item.unit === line.unit,
        );

        if (existing && hasServerCartId(existing.id)) {
          if (existing.quantity !== line.quantity) {
            await marketService.updateCartItemQuantity(existing.id, line.quantity);
          }
          continue;
        }

        await marketService.addCartItem({
          productId: line.productId,
          branchId,
          unit: line.unit,
          quantity: line.quantity,
        });
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
    hasGuestCartInStorage: () =>
      readGuestCartFromStorage().length > 0 || getGuestCartSnapshot(rawLines.value).length > 0,
  };
}
