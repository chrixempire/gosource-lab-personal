import type { OrderProductRecord } from '@gosource/api-client';
import { extractApiErrorMessage } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import {
  defaultUnitForProduct,
  getMarketProductById,
  isMarketProductInStock,
} from '~/lib/marketplace-data';

export type ReorderProductLine = Pick<
  OrderProductRecord,
  'productId' | 'unit' | 'quantity' | 'productName'
>;

export type ReorderProductsOptions = {
  /** @default true */
  openDrawer?: boolean;
  /** Navigate to /market when not already there so users can add more items. @default true */
  navigateToMarket?: boolean;
};

export type ReorderProductsResult = {
  ok: boolean;
  added: number;
  skipped: string[];
};

function resolveUnit(productId: string, unit: string | null | undefined) {
  const trimmed = unit?.trim();
  if (trimmed) {
    return trimmed;
  }

  const product = getMarketProductById(productId);
  return product ? defaultUnitForProduct(product) : 'Standard pack';
}

export function useReorderProducts() {
  const route = useRoute();
  const reordering = ref(false);
  const { setCartQuantityForUnit, getCartQtyForUnit, loadCart } = useMarketplaceCart();
  const { cartDrawerOpen } = useMarketplaceUi();
  const { ensureBranchForAction } = useMarketBranchGate();
  const { isAddingToRequest } = useRequestAddItemsMode();

  async function reorderProducts(
    lines: ReorderProductLine[],
    options: ReorderProductsOptions = {},
  ): Promise<ReorderProductsResult> {
    const openDrawer = options.openDrawer !== false;
    const navigateToMarket = options.navigateToMarket !== false;

    if (reordering.value) {
      return { ok: false, added: 0, skipped: [] };
    }

    if (isAddingToRequest.value) {
      toast.error('Finish adding items to the request before reordering.');
      return { ok: false, added: 0, skipped: [] };
    }

    if (!(await ensureBranchForAction())) {
      return { ok: false, added: 0, skipped: [] };
    }

    const skipped: string[] = [];
    const actionable = lines.filter((line) => {
      if (!line.productId || line.quantity <= 0) {
        if (line.quantity > 0) {
          skipped.push(line.productName || 'Product');
        }
        return false;
      }
      return true;
    });

    if (actionable.length === 0) {
      toast.error('No products on this order can be reordered.');
      return { ok: false, added: 0, skipped };
    }

    reordering.value = true;
    let added = 0;

    try {
      for (const line of actionable) {
        const productId = line.productId!;
        const unit = resolveUnit(productId, line.unit);
        const product = getMarketProductById(productId);
        const label = line.productName || product?.name || 'Product';

        if (product && !isMarketProductInStock(product)) {
          skipped.push(label);
          continue;
        }

        const current = getCartQtyForUnit(productId, unit);
        const next = Math.min(999, current + line.quantity);
        const success = await setCartQuantityForUnit(productId, unit, next, { silent: true });

        if (!success) {
          skipped.push(label);
          continue;
        }

        added += 1;
      }

      await loadCart(true);

      if (added === 0) {
        const preview = skipped.slice(0, 3).join(', ');
        const suffix = skipped.length > 3 ? '…' : '';
        toast.error(
          skipped.length
            ? `Could not add items to cart: ${preview}${suffix}`
            : 'Could not add order items to cart.',
        );
        return { ok: false, added, skipped };
      }

      if (navigateToMarket && !route.path.startsWith('/market')) {
        await navigateTo('/market');
        await nextTick();
      }

      if (openDrawer) {
        cartDrawerOpen.value = true;
      }

      if (skipped.length === 0) {
        toast.success(
          added === 1
            ? 'Order item added to cart. You can add more products before checkout.'
            : 'Order items added to cart. You can add more products before checkout.',
        );
      } else {
        toast.success(
          `${added} item${added === 1 ? '' : 's'} added to cart. ${skipped.length} could not be added. You can add more products before checkout.`,
        );
      }

      return { ok: true, added, skipped };
    } catch (error) {
      toast.error(
        extractApiErrorMessage(error, 'Unable to add order items to cart right now.'),
      );
      return { ok: false, added, skipped };
    } finally {
      reordering.value = false;
    }
  }

  return {
    reorderProducts,
    reordering,
  };
}
