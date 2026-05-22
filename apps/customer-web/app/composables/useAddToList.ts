import type { MarketProduct } from '~/lib/marketplace-data';
import { toast } from '@gosource/ui';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useCustomerShoppingListService } from '~/services/shopping-list.service';

export type PendingListItem = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unit: string;
};

export function useAddToList() {
  const pickerOpen = useState('add-to-list-picker-open', () => false);
  const pendingItem = useState<PendingListItem | null>('add-to-list-pending-item', () => null);
  const resumeProduct = useState<MarketProduct | null>('add-to-list-resume-product', () => null);
  const listsRefreshNonce = useState('shopping-lists-refresh-nonce', () => 0);

  const {
    activeBranchId,
    ensureBranchForAction,
    openBranchGate,
    requestProductModalResume,
  } = useMarketBranchGate();
  const { addItem } = useCustomerShoppingListService();

  const submitting = ref(false);

  function stageItem(item: PendingListItem) {
    pendingItem.value = item;
  }

  function clearPending() {
    pendingItem.value = null;
  }

  function closePicker() {
    pickerOpen.value = false;
  }

  function bumpListsRefresh() {
    listsRefreshNonce.value += 1;
  }

  function reopenProductModalIfNeeded() {
    const product = resumeProduct.value;
    resumeProduct.value = null;
    if (product) {
      requestProductModalResume(product);
    }
  }

  function cancelPicker() {
    closePicker();
    clearPending();
    reopenProductModalIfNeeded();
  }

  function buildPendingFromProduct(product: MarketProduct, unit: string, quantity: number): PendingListItem {
    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl ?? null,
      quantity: Math.max(1, quantity),
      unit,
    };
  }

  async function openPickerFromProduct(
    product: MarketProduct,
    unit: string,
    quantity: number,
    options?: { resumeProductModal?: boolean },
  ) {
    if (!product) {
      return false;
    }

    let branchId = activeBranchId.value;
    if (!branchId) {
      await ensureBranchForAction();
      branchId = activeBranchId.value;
    }

    if (!branchId) {
      if (options?.resumeProductModal) {
        requestProductModalResume(product);
      }
      await nextTick();
      openBranchGate();
      return false;
    }

    resumeProduct.value = options?.resumeProductModal ? product : null;
    stageItem(buildPendingFromProduct(product, unit, quantity));
    pickerOpen.value = true;
    return true;
  }

  async function addPendingToList(listId: string, listName?: string) {
    if (!pendingItem.value || submitting.value) {
      return false;
    }

    submitting.value = true;
    try {
      await addItem(listId, {
        productId: pendingItem.value.productId,
        quantity: pendingItem.value.quantity,
        unit: pendingItem.value.unit,
      });

      const label = listName ? `"${listName}"` : 'list';
      toast.success(`Added to ${label}`, {
        action: {
          label: 'View list',
          onClick: () => {
            void navigateTo({ path: '/lists', query: { list: listId } });
          },
        },
      });

      bumpListsRefresh();
      clearPending();
      closePicker();
      reopenProductModalIfNeeded();
      return true;
    } finally {
      submitting.value = false;
    }
  }

  return {
    pickerOpen,
    pendingItem,
    resumeProduct,
    listsRefreshNonce,
    submitting,
    stageItem,
    clearPending,
    closePicker,
    cancelPicker,
    openPickerFromProduct,
    addPendingToList,
    bumpListsRefresh,
    buildPendingFromProduct,
  };
}
