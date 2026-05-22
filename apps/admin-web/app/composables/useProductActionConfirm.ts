import type { ProductActionType } from '~/lib/product-action-copy';

export function useProductActionConfirm() {
  const open = ref(false);
  const action = ref<ProductActionType | null>(null);
  const productId = ref<string | null>(null);
  const productName = ref('');

  function requestConfirm(
    type: ProductActionType,
    product: { id: string; name: string },
  ) {
    action.value = type;
    productId.value = product.id;
    productName.value = product.name;
    open.value = true;
  }

  function reset() {
    action.value = null;
    productId.value = null;
    productName.value = '';
  }

  watch(open, (value) => {
    if (!value) {
      reset();
    }
  });

  return {
    open,
    action,
    productId,
    productName,
    requestConfirm,
    reset,
  };
}
