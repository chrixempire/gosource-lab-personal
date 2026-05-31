<script setup lang="ts">
import type { MarketProduct } from "~/lib/marketplace-data";
import {
  defaultUnitForProduct,
  isMarketProductInStock,
  isMultiUnitProduct,
} from "~/lib/marketplace-data";
import {
  exploreProductDiscountLabel,
  exploreProductMetaLine,
  exploreProductUnitLine,
} from "~/lib/explore-product-display";
import { Button } from "@gosource/ui";
import {
  formatNaira,
  useMarketplaceCart,
} from "~/composables/useMarketplaceCart";
import { useRequestAddItemsMode } from "~/composables/useRequestAddItemsMode";
import MarketProductImage from "~/components/market/MarketProductImage.vue";
import MarketProductQtyStrip from "~/components/market/MarketProductQtyStrip.vue";

const props = withDefaults(
  defineProps<{
    product: MarketProduct;
    /** Show discount badge only for percentage discounts. */
    percentageBadgeOnly?: boolean;
  }>(),
  {
    percentageBadgeOnly: false,
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
  if (!props.percentageBadgeOnly) {
    return exploreProductDiscountLabel(props.product);
  }

  return null;
});

const discountPercent = computed(() => {
  if (!props.percentageBadgeOnly) {
    return null;
  }

  if (props.product.discountPct && props.product.discountPct > 0) {
    return props.product.discountPct;
  }

  const promo = props.product.promotion;
  if (promo?.isPercentageDiscounted && promo.discountValue > 0) {
    return promo.discountValue;
  }

  return null;
});
const metaLine = computed(() => exploreProductMetaLine(props.product));
const unitLine = computed(() => exploreProductUnitLine(props.product));
const brandLine = computed(
  () => props.product.brandLabel?.trim() || metaLine.value,
);
const descriptionLine = computed(
  () => props.product.description?.trim() || brandLine.value,
);

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
      'flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border bg-background-on-canvas transition-[transform,border-color,background-color] duration-300 ease-out hover:-translate-y-1',
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
        class="group relative aspect-[1.12/1] w-full shrink-0 overflow-hidden bg-grey-55"
      >
        <MarketProductImage
          :src="product.imageUrl"
          :alt="product.name"
          :hover-zoom="true"
          :class="{ grayscale: !inStock }"
          logo-class="w-[72%] max-w-[8rem]"
        />

        <span
          v-if="discountPercent"
          class="customer-image-discount-badge absolute right-2 top-2 z-10 flex size-[3.25rem] flex-col items-center justify-center rounded-full text-center"
        >
          <span class="text-sm font-bold leading-none">{{ discountPercent }}%</span>
          <span class="mt-0.5 text-[10px] font-medium leading-none">Off</span>
        </span>

        <span
          v-else-if="discountLabel"
          class="customer-image-discount-pill absolute left-2 top-2 z-10 rounded-full px-2 py-1 text-[11px] font-bold leading-none"
        >
          {{ discountLabel }}
        </span>
      </div>

      <div class="flex flex-1 flex-col gap-1.5 px-3 pb-2.5 pt-2.5">
        <div class="flex min-h-[5rem] flex-col gap-1">
          <h3
            class="line-clamp-2 min-h-[2.2rem] text-[14px] font-medium leading-snug text-grey-900"
          >
            {{ product.name }}
          </h3>

          <p
            v-if="descriptionLine"
            class="line-clamp-2 text-[11px] leading-4 text-grey-300"
          >
            {{ descriptionLine }}
          </p>
        </div>

        <div class="mt-auto space-y-1">
          <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span
              class="text-[15px] font-bold tabular-nums leading-tight text-grey-900"
            >
              {{ formatNaira(product.priceNaira) }}
            </span>
            <span
              v-if="product.compareAtNaira"
              class="text-[12px] tabular-nums text-grey-300 line-through"
            >
              {{ formatNaira(product.compareAtNaira) }}
            </span>
          </div>
          <p v-if="unitLine" class="line-clamp-1 text-[11px] text-grey-300">
            {{ unitLine }}
          </p>
        </div>
      </div>
    </div>

    <div class="w-full shrink-0 border-t border-grey-50" role="presentation" />

    <div class="flex justify-center px-3 pb-2.5 pt-2.5" @click.stop>
      <Button
        v-if="!inStock"
        size="small"
        variant="destructive"
        class="!h-9 !max-w-full !rounded-full !px-3 !text-xs !font-semibold"
        type="button"
        disabled
      >
        Out of stock
      </Button>

      <Button
        v-else-if="showAddButton"
        size="small"
        class="!h-9 !max-w-full !rounded-full !px-3 !text-sm !font-semibold shadow-[0_8px_18px_-10px_rgba(4,85,11,0.58)] dark:shadow-none"
        type="button"
        @click="onAdd"
      >
        + Add
      </Button>

      <div v-else-if="showQtyStrip" class="w-full max-w-full">
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
