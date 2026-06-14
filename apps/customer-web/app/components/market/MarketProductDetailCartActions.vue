<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import MarketProductQtyStrip from './MarketProductQtyStrip.vue';

const props = withDefaults(
  defineProps<{
    product: MarketProduct;
    unit: string;
    inStock: boolean;
    /** Close parent dialog after a successful add (product modal). */
    closeOnSuccess?: boolean;
    /** Stretch the add button to fill remaining footer width (slide product modal). */
    expandAddButton?: boolean;
    /** Product details page: out-of-stock CTA at half width. */
    narrowOutOfStock?: boolean;
  }>(),
  { expandAddButton: false, narrowOutOfStock: false },
);

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
      :class="[
        '!h-14 !rounded-full !text-[17px] !font-semibold shadow-md',
        narrowOutOfStock ? '!w-1/2' : 'w-full',
      ]"
      type="button"
      disabled
    >
      Out of stock
    </Button>
    <div v-else class="flex w-full min-w-0 items-center gap-2.5">
      <MarketProductQtyStrip
        v-model="pickQty"
        variant="detail"
        class="shrink-0"
        :disabled="addingToCart"
      />
      <Button
        variant="primary"
        size="medium"
        :class="[
          '!rounded-full',
          expandAddButton
            ? '!min-w-0 !w-full flex-1'
            : '!w-auto shrink-0',
        ]"
        type="button"
        :loading="addingToCart"
        @click="onAddToCart"
      >
        Add to cart
      </Button>
    </div>
  </div>
</template>
