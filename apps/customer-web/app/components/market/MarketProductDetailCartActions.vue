<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import MarketProductQtyStrip from './MarketProductQtyStrip.vue';

const props = defineProps<{
  product: MarketProduct;
  unit: string;
  inStock: boolean;
  /** Close parent dialog after a successful add (product modal). */
  closeOnSuccess?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const pickQty = defineModel<number>('quantity', { default: 1 });
const addingToCart = ref(false);
const { getQtyForUnit, setQuantityForUnit } = useMarketplaceCart();

function syncPickQtyFromCart() {
  const inCart = getQtyForUnit(props.product.id, props.unit);
  pickQty.value = Math.max(1, inCart > 0 ? inCart : 1);
}

watch(
  () => [props.product.id, props.unit] as const,
  () => syncPickQtyFromCart(),
  { immediate: true },
);

async function onAddToCart() {
  if (!props.inStock || !props.unit || addingToCart.value) {
    return;
  }

  addingToCart.value = true;

  try {
    const added = await setQuantityForUnit(props.product.id, props.unit, pickQty.value, {
      product: props.product,
    });
    if (added && props.closeOnSuccess) {
      emit('close');
    }
  } catch {
    /* toasts handled in market service */
  } finally {
    addingToCart.value = false;
  }
}
</script>

<template>
  <div class="w-full min-w-0">
    <Button
      v-if="!inStock"
      size="large"
      variant="destructive"
      class="!h-14 w-full !rounded-full !text-[17px] !font-semibold shadow-md"
      type="button"
      disabled
    >
      Out of stock
    </Button>
    <div v-else class="flex w-full min-w-0 items-center gap-3">
      <MarketProductQtyStrip v-model="pickQty" variant="detail" :disabled="addingToCart" />
      <Button
        variant="primary"
        class="!w-auto shrink-0 !rounded-full"
        type="button"
        :loading="addingToCart"
        @click="onAddToCart"
      >
        Add to cart
      </Button>
    </div>
  </div>
</template>
