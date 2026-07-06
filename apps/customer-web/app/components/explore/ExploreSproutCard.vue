<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import {
  defaultUnitForProduct,
  isMarketProductInStock,
  isMultiUnitProduct,
} from '~/lib/marketplace-data';
import {
  smallestUnitForProduct,
  sproutUnitLine,
} from '~/lib/explore-product-display';
import { Plus } from 'lucide-vue-next';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import ExploreSproutQtyStrip from '~/components/explore/ExploreSproutQtyStrip.vue';

const props = defineProps<{
  product: MarketProduct;
  /** Accepted for parity with the standard card (promotions rows); not used here. */
  percentageBadgeOnly?: boolean;
}>();

const openAddModal = inject<(p: MarketProduct) => void>('marketOpenAddModal', () => {});

const { addOne, getQtyForUnit, getTotalQtyForProduct } = useMarketplaceCart();
const { isAddingToRequest } = useRequestAddItemsMode();

const multi = computed(() => isMultiUnitProduct(props.product));
const defaultUnit = computed(() => defaultUnitForProduct(props.product));
const inStock = computed(() => isMarketProductInStock(props.product));

// The card always speaks in the smallest (entry-point) unit.
const smallest = computed(() => smallestUnitForProduct(props.product));
const unitLine = computed(() => sproutUnitLine(props.product));

const singleLineQty = computed(() =>
  getQtyForUnit(props.product.id, defaultUnit.value),
);
const anyInCart = computed(() => getTotalQtyForProduct(props.product.id) > 0);
const inCartHighlight = computed(() =>
  multi.value ? anyInCart.value : singleLineQty.value > 0,
);

const showQtyStrip = computed(
  () => !multi.value && singleLineQty.value > 0 && inStock.value,
);
const showAddButton = computed(
  () => inStock.value && (multi.value || singleLineQty.value === 0),
);

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

function onCardClick() {
  openAddModal(props.product);
}
async function onAdd(e: MouseEvent) {
  e.stopPropagation();
  if (!inStock.value) return;
  if (isAddingToRequest.value && !multi.value) {
    await addOne(props.product.id, defaultUnit.value, { product: props.product });
    return;
  }
  openAddModal(props.product);
}
</script>

<template>
  <!-- Sprouts-style card: white, clean, rounded; no favourite icon. -->
  <article
    data-testid="explore-sprout-card"
    class="flex h-full min-w-0 flex-col rounded-[10px] border bg-white p-1 text-left transition"
    :class="inCartHighlight ? 'border-primary-500 ring-1 ring-primary-500' : 'border-grey-50 hover:border-primary-500'"
  >
    <div
      class="flex min-h-0 flex-1 cursor-pointer flex-col"
      role="button"
      tabindex="0"
      @click="onCardClick"
      @keydown.enter.prevent="onCardClick"
    >
      <div class="group relative aspect-square w-full shrink-0 overflow-hidden rounded-[8px] bg-white">
        <MarketProductImage
          :src="product.imageUrl"
          :alt="product.name"
          :hover-zoom="true"
          :class="{ 'grayscale opacity-60': !inStock }"
          logo-class="w-[72%] max-w-[8rem]"
        />
        <!-- Promotion ribbon: top-left, flush in the image corner (4px from the
             card edge via the card's p-1). Banner shape with a swooped bottom-right. -->
        <span
          v-if="inStock && discountPercent"
          class="pointer-events-none absolute left-0 top-0 z-10 rounded-br-[12px] rounded-tl-[8px] bg-negative-500 px-2.5 py-1.5 text-[13px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm"
          aria-hidden="true"
        >
          {{ discountPercent }}% OFF
        </span>
        <span
          v-if="!inStock"
          class="absolute right-3 top-3 z-10 rounded-full bg-[#FEE4E2] px-2.5 py-1.5 text-[11px] font-medium leading-none text-[#D92D20] shadow-sm"
        >
          Out of stock
        </span>

        <!-- Add affordance lives in the image corner. Single-unit in cart →
             the quantity strip occupies the same spot the "+" was in. -->
        <button
          v-if="showAddButton"
          type="button"
          class="absolute bottom-2 right-2 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary-500 text-white shadow-md transition hover:bg-primary-600"
          aria-label="Add to cart"
          @click.stop="onAdd"
        >
          <Plus class="size-5 stroke-[3]" aria-hidden="true" />
        </button>

        <div v-else-if="showQtyStrip" class="absolute bottom-2 right-2 z-10" @click.stop>
          <ExploreSproutQtyStrip
            :product-id="product.id"
            :product="product"
            :unit="defaultUnit"
          />
        </div>
      </div>

      <!-- Name + price grouped tightly (no gap). -->
      <div class="w-full space-y-1 px-0.5 pt-3">
        <h3 class="w-full line-clamp-2 text-left text-[14px] font-medium leading-snug text-grey-900">
          {{ product.name }}
        </h3>
        <div class="flex w-full flex-wrap items-baseline justify-start gap-x-1.5">
          <span v-if="multi" class="text-[11px] font-semibold leading-none text-negative-500">
            From
          </span>
          <span
            class="text-[15px] font-bold tabular-nums leading-tight text-grey-900"
            :class="{ 'text-grey-300 line-through': !inStock }"
          >
            {{ formatNaira(smallest.priceNaira) }}
          </span>
        </div>
        <p
          class="w-full line-clamp-1 text-left text-[11px] text-grey-300"
          :class="{ 'line-through': !inStock }"
        >
          {{ unitLine }}
        </p>
      </div>
    </div>
  </article>
</template>
