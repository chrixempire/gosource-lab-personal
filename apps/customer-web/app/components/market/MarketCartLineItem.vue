<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { Trash2 } from 'lucide-vue-next';
import {
  exploreProductDiscountLabel,
  exploreProductMetaLine,
} from '~/lib/explore-product-display';
import { formatNaira } from '~/composables/useMarketplaceCart';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import MarketProductQtyStrip from '~/components/market/MarketProductQtyStrip.vue';

const props = defineProps<{
  product: MarketProduct;
  productId: string;
  unit: string;
  quantity: number;
  lineTotalNaira: number;
  inStock: boolean;
  unitLabel: string;
  removeLabel: string;
}>();

const emit = defineEmits<{
  remove: [];
}>();

const discountLabel = computed(() => exploreProductDiscountLabel(props.product));
const metaLine = computed(() => exploreProductMetaLine(props.product));

const unitPriceLabel = computed(() =>
  formatNaira(
    props.quantity > 0 ? props.lineTotalNaira / props.quantity : props.lineTotalNaira,
  ),
);
</script>

<template>
  <article
    class="customer-surface-card flex gap-3 rounded-[16px] p-3"
  >
    <div class="relative aspect-square w-[5.5rem] shrink-0 overflow-hidden rounded-[14px] bg-grey-55">
      <MarketProductImage
        :src="product.imageUrl"
        :alt="product.name"
        :hover-zoom="false"
        logo-class="w-[72%] max-w-[3.25rem]"
        :class="{ grayscale: !inStock }"
      />

      <span
        v-if="discountLabel"
        class="absolute left-1.5 top-1.5 z-10 rounded-md bg-[#B42318] px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white shadow-sm"
      >
        {{ discountLabel }}
      </span>
    </div>

    <div class="min-w-0 flex-1">
      <p class="line-clamp-2 text-sm font-semibold leading-snug text-grey-900">
        {{ product.name }}
      </p>

      <p v-if="metaLine" class="mt-0.5 line-clamp-1 text-xs text-grey-300">
        {{ metaLine }}
      </p>

      <p class="mt-0.5 text-xs text-grey-300">
        <template v-if="unitLabel">{{ unitLabel }} · </template>
        {{ unitPriceLabel }} each
      </p>

      <p v-if="!inStock" class="mt-1 text-xs font-medium text-negative-500">
        Out of stock — remove this item to continue.
      </p>

      <div class="mt-2 w-full max-w-[7.75rem]">
        <Button
          v-if="!inStock"
          size="small"
          variant="destructive"
          class="!h-7 !rounded-full !px-3 !text-[12px] !font-semibold"
          type="button"
          disabled
        >
          Out of stock
        </Button>
        <MarketProductQtyStrip
          v-else
          :product-id="productId"
          :product="product"
          :unit="unit"
          variant="cart"
        />
      </div>
    </div>

    <div class="flex shrink-0 flex-col items-end justify-between gap-2 pt-0.5">
      <p class="text-sm font-semibold tabular-nums text-grey-900">
        {{ formatNaira(lineTotalNaira) }}
      </p>
      <button
        type="button"
        class="flex size-8 cursor-pointer items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600"
        :aria-label="removeLabel"
        @click="emit('remove')"
      >
        <Trash2 class="size-4" />
      </button>
    </div>
  </article>
</template>
