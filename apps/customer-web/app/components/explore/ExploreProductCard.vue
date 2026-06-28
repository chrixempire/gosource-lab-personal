<script setup lang="ts">
import type { MarketProduct } from "~/lib/marketplace-data";
import {
  defaultUnitForProduct,
  isMarketProductInStock,
  isMultiUnitProduct,
} from "~/lib/marketplace-data";
import {
  exploreProductDiscountLabel,
  exploreProductUnitLine,
} from "~/lib/explore-product-display";
import { Plus } from "lucide-vue-next";
import {
  formatNaira,
  useMarketplaceCart,
} from "~/composables/useMarketplaceCart";
import { useRequestAddItemsMode } from "~/composables/useRequestAddItemsMode";
import MarketProductImage from "~/components/market/MarketProductImage.vue";
import MarketProductDiscountRibbon from "~/components/market/MarketProductDiscountRibbon.vue";
import MarketProductQtyStrip from "~/components/market/MarketProductQtyStrip.vue";

const props = withDefaults(
  defineProps<{
    product: MarketProduct;
    /** Show discount badge only for percentage discounts. */
    percentageBadgeOnly?: boolean;
    roundedClass?: string;
  }>(),
  {
    percentageBadgeOnly: false,
    roundedClass: 'rounded-[24px]',
  },
);

const openAddModal = inject<(p: MarketProduct) => void>(
  "marketOpenAddModal",
  () => {},
);

const { addOne, getQtyForUnit, getTotalQtyForProduct } = useMarketplaceCart();
const { isAddingToRequest } = useRequestAddItemsMode();

const multi = computed(() => isMultiUnitProduct(props.product));
const defaultUnit = computed(() => defaultUnitForProduct(props.product));
const inStock = computed(() => isMarketProductInStock(props.product));
const singleLineQty = computed(() =>
  getQtyForUnit(props.product.id, defaultUnit.value),
);
const anyInCart = computed(() => getTotalQtyForProduct(props.product.id) > 0);

const inCartHighlight = computed(() => {
  if (multi.value) {
    return anyInCart.value;
  }

  return singleLineQty.value > 0;
});

const showQtyStrip = computed(
  () => !multi.value && singleLineQty.value > 0 && inStock.value,
);
const showAddButton = computed(
  () => inStock.value && (multi.value || singleLineQty.value === 0),
);

const discountLabel = computed(() => {
  if (props.percentageBadgeOnly || discountPercent.value) {
    return null;
  }

  return exploreProductDiscountLabel(props.product);
});

const discountPercent = computed(() => {
  if (props.product.discountPct && props.product.discountPct > 0) {
    return props.product.discountPct;
  }

  const promo = props.product.promotion;
  if (promo?.isPercentageDiscounted && promo.discountValue > 0) {
    return promo.discountValue;
  }

  return null;
});
const unitLine = computed(() => exploreProductUnitLine(props.product));

function onCardClick() {
  openAddModal(props.product);
}

async function onAdd(e: MouseEvent) {
  e.stopPropagation();
  if (!inStock.value) {
    return;
  }

  if (isAddingToRequest.value && !multi.value) {
    await addOne(props.product.id, defaultUnit.value, {
      product: props.product,
    });
    return;
  }

  openAddModal(props.product);
}
</script>

<template>
  <article
    data-testid="explore-product-card"
    :class="[
      `flex h-full min-w-0 flex-col overflow-hidden p-2.5 text-left ${props.roundedClass} border bg-background-on-canvas transition-[border-color,background-color,box-shadow] duration-300 ease-out hover:shadow-[0_10px_24px_-16px_rgba(16,24,40,0.28)]`,
      inCartHighlight
        ? 'border-2 border-primary-500 bg-primary-50/40 dark:border-primary-500/50 dark:bg-primary-500/12'
        : 'border border-grey-50 hover:border-primary-500/35 dark:hover:border-primary-500/25',
    ]"
  >
    <div
      class="flex min-h-0 flex-1 cursor-pointer flex-col"
      role="button"
      tabindex="0"
      @click="onCardClick"
      @keydown.enter.prevent="onCardClick"
    >
      <div
        class="group relative aspect-square w-full shrink-0 overflow-hidden rounded-[20px] bg-grey-55"
      >
        <MarketProductImage
          :src="product.imageUrl"
          :alt="product.name"
          :hover-zoom="true"
          :class="{ 'grayscale opacity-60': !inStock }"
          logo-class="w-[72%] max-w-[8rem]"
        />

        <MarketProductDiscountRibbon
          v-if="inStock && discountPercent"
          :percent="discountPercent"
        />

        <span
          v-else-if="inStock && discountLabel"
          class="customer-image-discount-pill absolute right-3 top-3 z-10 rounded-full px-2 py-1 text-[11px] font-bold leading-none"
        >
          {{ discountLabel }}
        </span>

        <span
          v-if="!inStock"
          class="absolute right-3 top-3 z-10 rounded-full bg-[#FEE4E2] px-2.5 py-1.5 text-[11px] font-medium leading-none text-[#D92D20] shadow-sm"
        >
          Out of stock
        </span>
      </div>

      <div class="flex w-full flex-1 flex-col items-start gap-1.5 px-0.5 pb-0 pt-3">
        <h3
          class="w-full line-clamp-2 text-left text-[14px] font-medium leading-snug text-grey-900"
        >
          {{ product.name }}
        </h3>

        <div class="mt-auto w-full space-y-1">
          <div class="flex w-full flex-wrap items-center justify-start gap-x-1.5 gap-y-1">
            <span
              v-if="multi"
              class="text-[11px] font-semibold leading-none text-negative-500"
            >
              From
            </span>
            <span
              class="text-[15px] font-bold tabular-nums leading-tight text-grey-900"
            >
              {{ formatNaira(product.priceNaira) }}
            </span>
          </div>
          <p v-if="unitLine" class="w-full line-clamp-1 text-left text-[11px] text-grey-300">
            {{ unitLine }}
          </p>
        </div>
      </div>
    </div>

    <div class="w-full shrink-0 px-0 pb-0 pt-2.5" @click.stop>
      <button
        v-if="!inStock"
        type="button"
        disabled
        class="flex h-10 w-full shrink-0 cursor-not-allowed items-center justify-center gap-1 self-stretch rounded-[100px] border-2 border-white bg-[#F0F2F5] px-4 text-base font-bold text-[#98A2B3] shadow-[0_4px_8px_0_rgba(71,83,103,0.10)] dark:border-grey-700 dark:bg-grey-800 dark:text-grey-400"
      >
        <Plus class="size-[18px] stroke-[3]" aria-hidden="true" />
        Add
      </button>

      <button
        v-else-if="showAddButton"
        type="button"
        class="flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-1 self-stretch rounded-[100px] border-2 border-white bg-[#F0F2F5] px-4 text-base font-bold text-[#101928] shadow-[0_4px_8px_0_rgba(71,83,103,0.10)] transition-colors hover:bg-[#E4E7EC] dark:border-primary-500/40 dark:bg-primary-500/12 dark:text-[#22c55e] dark:shadow-none dark:hover:bg-primary-500/20"
        @click="onAdd"
      >
        <Plus class="size-[18px] stroke-[3]" aria-hidden="true" />
        Add
      </button>

      <div v-else-if="showQtyStrip" class="w-full">
        <MarketProductQtyStrip
          :product-id="product.id"
          :product="product"
          :unit="defaultUnit"
          variant="explore"
        />
      </div>
    </div>
  </article>
</template>
