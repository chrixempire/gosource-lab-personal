<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { defaultUnitForProduct, isMarketProductInStock, isMultiUnitProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import MarketProductQtyStrip from './MarketProductQtyStrip.vue';
import MarketProductImage from './MarketProductImage.vue';

const props = defineProps<{
  products: MarketProduct[];
  /** Omit top border when parent provides separation */
  flush?: boolean;
}>();

const emit = defineEmits<{
  pick: [product: MarketProduct];
}>();

const { addOne, getQtyForUnit, getTotalQtyForProduct } = useMarketplaceCart();
const { isAddingToRequest } = useRequestAddItemsMode();

const rail = ref<HTMLElement | null>(null);
const canScrollProducts = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateHints() {
  const el = rail.value;
  if (!el) {
    return;
  }
  const { scrollLeft, scrollWidth, clientWidth } = el;
  canScrollProducts.value = scrollWidth > clientWidth + 2;
  canScrollLeft.value = scrollLeft > 4;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 4;
}

function scrollBy(delta: number) {
  rail.value?.scrollBy({ left: delta, behavior: 'smooth' });
}

function anyInCart(p: MarketProduct) {
  return getTotalQtyForProduct(p.id) > 0;
}

function isMulti(p: MarketProduct) {
  return isMultiUnitProduct(p);
}

function defaultUnit(p: MarketProduct) {
  return defaultUnitForProduct(p);
}

function singleQty(p: MarketProduct) {
  return getQtyForUnit(p.id, defaultUnit(p));
}

function inStock(p: MarketProduct) {
  return isMarketProductInStock(p);
}

function onPick(p: MarketProduct) {
  emit('pick', p);
}

async function onAddClick(e: MouseEvent, p: MarketProduct) {
  e.stopPropagation();
  if (!inStock(p)) {
    return;
  }

  if (isAddingToRequest.value && !isMulti(p)) {
    await addOne(p.id, defaultUnit(p));
    return;
  }

  emit('pick', p);
}

onMounted(() => {
  nextTick(updateHints);
});

watch(
  () => props.products.length,
  () => nextTick(updateHints),
);
</script>

<template>
  <div
    v-if="products.length"
    :class="[
      'space-y-3 pt-4',
      props.flush ? '' : 'border-t border-grey-50',
    ]"
  >
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-grey-900">
        Similar products
      </h3>
      <div v-if="canScrollProducts" class="flex gap-1">
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 shadow-sm transition hover:bg-primary-50/70 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-grey-900"
          :disabled="!canScrollLeft"
          aria-label="Scroll similar products left"
          @click="scrollBy(-200)"
        >
          <ChevronLeft class="size-5" />
        </button>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 shadow-sm transition hover:bg-primary-50/70 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-grey-900"
          :disabled="!canScrollRight"
          aria-label="Scroll similar products right"
          @click="scrollBy(200)"
        >
          <ChevronRight class="size-5" />
        </button>
      </div>
    </div>

    <div
      ref="rail"
      class="flex touch-pan-x gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      @scroll.passive="updateHints"
    >
      <div
        v-for="p in products"
        :key="p.id"
        role="button"
        tabindex="0"
        class="flex min-w-[11.5rem] w-[min(11.5rem,calc(50vw-2.5rem))] shrink-0 cursor-pointer flex-col gap-2 sm:w-48"
        @click="onPick(p)"
        @keydown.enter.prevent="onPick(p)"
      >
        <div
          :class="[
            'rounded-[18px] p-1 transition-[box-shadow,border-color]',
            anyInCart(p)
              ? 'border-2 border-primary-500 bg-primary-50/70 shadow-[0_6px_16px_-8px_rgba(4,85,11,0.35)]'
              : 'border-2 border-transparent',
          ]"
        >
          <div class="group relative aspect-square w-full overflow-hidden rounded-[14px] bg-grey-55">
            <MarketProductImage
              :src="p.imageUrl"
              :alt="p.name"
              :class="{ grayscale: !inStock(p) }"
            />
            <div class="absolute right-2 top-2 z-10 max-w-[40%] min-w-0" @click.stop>
              <Button
                v-if="!inStock(p)"
                size="small"
                variant="destructive"
                class="!h-8 w-full min-w-[6.5rem] !rounded-full !px-2 !text-[12px] !font-semibold shadow-md"
                type="button"
                disabled
              >
                Out of stock
              </Button>
              <Button
                v-else-if="isMulti(p) || singleQty(p) === 0"
                size="small"
                class="!h-8 w-full min-w-0 !min-w-0 !rounded-full !px-2 !text-[12px] !font-semibold shadow-md"
                type="button"
                @click="onAddClick($event, p)"
              >
                + Add
              </Button>
              <div v-else class="w-full min-w-0 max-w-full">
                <MarketProductQtyStrip :product-id="p.id" :unit="defaultUnit(p)" variant="card" />
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-1" @click.stop>
          <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span
              class="inline-flex rounded px-1 text-[17px] font-bold leading-tight text-grey-900"
              :class="p.compareAtNaira ? 'bg-orange-brick text-white' : ''"
            >
              {{ formatNaira(p.priceNaira) }}
            </span>
            <span
              v-if="p.compareAtNaira"
              class="text-[14px] text-grey-300 line-through"
            >
              {{ formatNaira(p.compareAtNaira) }}
            </span>
          </div>
          <p v-if="p.discountPct" class="text-[12px] font-semibold text-primary-500">
            {{ p.discountPct }}% off
          </p>
          <p class="line-clamp-2 text-[14px] font-normal leading-snug text-grey-900">
            {{ p.name }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
