<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

const props = defineProps<{
  products: MarketProduct[];
  /** Omit top border when parent provides separation */
  flush?: boolean;
}>();

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
          class="customer-control-btn flex size-9 shadow-sm"
          :disabled="!canScrollLeft"
          aria-label="Scroll similar products left"
          @click="scrollBy(-220)"
        >
          <ChevronLeft class="size-5" />
        </button>
        <button
          type="button"
          class="customer-control-btn flex size-9 shadow-sm"
          :disabled="!canScrollRight"
          aria-label="Scroll similar products right"
          @click="scrollBy(220)"
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
        v-for="product in products"
        :key="product.id"
        class="w-[220px] shrink-0"
      >
        <ExploreProductCard :product="product" />
      </div>
    </div>
  </div>
</template>
