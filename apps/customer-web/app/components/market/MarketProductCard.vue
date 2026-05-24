<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { defaultUnitForProduct, isMarketProductInStock, isMultiUnitProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import MarketProductImage from './MarketProductImage.vue';
import MarketProductQtyStrip from './MarketProductQtyStrip.vue';

const props = withDefaults(
  defineProps<{
    product: MarketProduct;
    /**
     * Category page: on narrow viewports use full row width (one column); wider viewports use index sizing.
     * Omit on market index so the horizontal rail keeps fixed card widths.
     */
    narrowFullWidth?: boolean;
  }>(),
  { narrowFullWidth: false },
);

const openAddModal = inject<(p: MarketProduct) => void>('marketOpenAddModal', () => {});

const { addOne, getQtyForUnit, getTotalQtyForProduct } = useMarketplaceCart();
const { isAddingToRequest } = useRequestAddItemsMode();

const multi = computed(() => isMultiUnitProduct(props.product));
const defaultUnit = computed(() => defaultUnitForProduct(props.product));
const inStock = computed(() => isMarketProductInStock(props.product));
const anyInCart = computed(() => getTotalQtyForProduct(props.product.id) > 0);
const singleLineQty = computed(() => getQtyForUnit(props.product.id, defaultUnit.value));

function onCardClick() {
  openAddModal(props.product);
}

async function onAdd(e: MouseEvent) {
  e.stopPropagation();
  if (!inStock.value) {
    return;
  }

  if (isAddingToRequest.value && !multi.value) {
    await addOne(props.product.id, defaultUnit.value, { product: props.product });
    return;
  }

  openAddModal(props.product);
}
</script>

<template>
  <article
    :class="[
      'flex shrink-0 cursor-pointer flex-col gap-2',
      narrowFullWidth
        ? 'w-full min-w-0 min-[441px]:min-w-[11.5rem] min-[441px]:w-[min(11.5rem,calc(50vw-2.5rem))] sm:w-48'
        : 'min-w-[11.5rem] w-[min(11.5rem,calc(50vw-2.5rem))] sm:w-48',
    ]"
    role="button"
    tabindex="0"
    @click="onCardClick"
    @keydown.enter.prevent="onCardClick"
  >
    <div
      :class="[
        'rounded-[18px] p-1 transition-[box-shadow,border-color]',
        anyInCart
          ? 'border-2 border-primary-500 bg-primary-50/70 shadow-[0_6px_16px_-8px_rgba(4,85,11,0.35)]'
          : 'border-2 border-transparent',
      ]"
    >
      <div class="group relative aspect-square w-full overflow-hidden rounded-[14px] bg-grey-55">
        <MarketProductImage
          :src="product.imageUrl"
          :alt="product.name"
          :class="{ grayscale: !inStock }"
        />

        <div
          v-if="product.promotion && product.promotion.discountValue > 0"
          class="absolute left-2 top-2 z-10 flex size-14 flex-col items-center justify-center rounded-full border-2 border-white bg-primary-600 p-1 text-white shadow-lg"
        >
          <p class="text-center text-sm font-bold leading-none">
            {{
              product.promotion.isPercentageDiscounted
                ? `${product.promotion.discountValue}%`
                : `₦${product.promotion.discountValue}`
            }}
          </p>
          <p class="mt-0.5 text-[10px] font-medium leading-none">
            Off
          </p>
        </div>

        <div class="absolute right-2 top-2 z-10" @click.stop>
          <Button
            v-if="!inStock"
            size="small"
            variant="destructive"
            class="!h-8 !min-w-[6.5rem] !rounded-full !px-3 !text-[12px] !font-semibold shadow-md"
            type="button"
            disabled
          >
            Out of stock
          </Button>
          <Button
            v-else-if="multi || singleLineQty === 0"
            size="small"
            class="!h-8 !min-w-[4.25rem] !rounded-full !px-3 !text-[13px] !font-semibold shadow-md"
            type="button"
            @click="onAdd"
          >
            + Add
          </Button>

          <div v-else class="min-w-[7.75rem] max-w-[11rem]">
            <MarketProductQtyStrip
              :product-id="product.id"
              :product="product"
              :unit="defaultUnit"
              variant="card"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-1" @click.stop>
      <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span
          class="inline-flex rounded px-1 text-[17px] font-bold leading-tight text-grey-900"
          :class="product.compareAtNaira ? 'bg-orange-brick text-white' : ''"
        >
          {{ formatNaira(product.priceNaira) }}
        </span>
        <span
          v-if="product.compareAtNaira"
          class="text-[14px] text-grey-300 line-through"
        >
          {{ formatNaira(product.compareAtNaira) }}
        </span>
      </div>
      <p v-if="product.discountPct" class="text-[12px] font-semibold text-primary-500">
        {{ product.discountPct }}% off
      </p>
      <p class="line-clamp-2 text-[14px] font-normal leading-snug text-grey-900">
        {{ product.name }}
      </p>
    </div>
  </article>
</template>
