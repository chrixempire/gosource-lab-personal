<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { useMediaQuery } from '@vueuse/core';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';
import { useExploreMobileProductScroller } from '~/composables/useExploreMobileProductScroller';
import { exploreMobileTripleScrollMediaQuery } from '~/lib/explore-product-layout';

const props = defineProps<{
  products: MarketProduct[];
}>();

/** ≤600px: fixed card width + horizontal scroll for the 3rd column. */
const isTripleScrollViewport = useMediaQuery(exploreMobileTripleScrollMediaQuery);

/** Fewer than 3 products — no horizontal scroll or chevrons. */
const usesCompactLayout = computed(() => props.products.length < 3);

const usesTripleScrollLayout = computed(
  () => props.products.length >= 3 && isTripleScrollViewport.value,
);

const gridColumnCount = computed(() =>
  usesCompactLayout.value
    ? Math.max(1, props.products.length)
    : 3,
);

const scrollerRef = ref<HTMLElement | null>(null);

const {
  canScroll: canScrollDom,
  canScrollLeft,
  canScrollRight,
  scrollByDirection,
  scheduleScrollHintsUpdate,
} = useExploreMobileProductScroller(scrollerRef);

const canScroll = computed(
  () => usesTripleScrollLayout.value && canScrollDom.value,
);

watch(
  () => props.products.length,
  () => scheduleScrollHintsUpdate(),
);

watch(isTripleScrollViewport, () => scheduleScrollHintsUpdate());

defineExpose({
  canScroll,
  canScrollLeft,
  canScrollRight,
  scrollByDirection,
});
</script>

<template>
  <div
    ref="scrollerRef"
    class="explore-mobile-triple-grid-scroller"
    :class="{ 'explore-mobile-triple-grid-scroller--compact': usesCompactLayout }"
    data-testid="explore-mobile-product-triple-grid"
  >
    <div
      class="explore-mobile-triple-grid"
      :class="{ 'explore-mobile-triple-grid--compact': usesCompactLayout }"
      :style="{ '--grid-cols': gridColumnCount }"
    >
      <div
        v-for="product in products"
        :key="product.id"
        class="explore-mobile-triple-grid-cell"
      >
        <ExploreProductCard :product="product" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore-mobile-triple-grid-scroller {
  width: 100%;
  min-width: 0;
  overflow-x: visible;
  touch-action: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.explore-mobile-triple-grid-scroller::-webkit-scrollbar {
  display: none;
}

/*
 * 601px–899px: three equal columns, full width, no horizontal scroll.
 * ≤600px: fixed 182px columns; scroll to reveal the 3rd card per row.
 */
.explore-mobile-triple-grid {
  --explore-mobile-card-width: 11.375rem;
  --explore-mobile-card-gap: 0.75rem;
  --grid-cols: 3;

  display: grid;
  width: 100%;
  min-width: 0;
  gap: var(--explore-mobile-card-gap);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.explore-mobile-triple-grid:not(.explore-mobile-triple-grid--compact)
  .explore-mobile-triple-grid-cell {
  width: auto;
  min-width: 0;
  max-width: none;
}

.explore-mobile-triple-grid--compact {
  width: max-content;
  grid-template-columns: repeat(var(--grid-cols), var(--explore-mobile-card-width));
}

.explore-mobile-triple-grid--compact .explore-mobile-triple-grid-cell {
  width: var(--explore-mobile-card-width);
  min-width: var(--explore-mobile-card-width);
  max-width: var(--explore-mobile-card-width);
}

@media (max-width: 600px) {
  .explore-mobile-triple-grid-scroller:not(
      .explore-mobile-triple-grid-scroller--compact
    ) {
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }

  .explore-mobile-triple-grid:not(.explore-mobile-triple-grid--compact) {
    width: max-content;
    min-width: calc(
      3 * var(--explore-mobile-card-width) + 2 * var(--explore-mobile-card-gap)
    );
    grid-template-columns: repeat(3, var(--explore-mobile-card-width));
  }

  .explore-mobile-triple-grid:not(.explore-mobile-triple-grid--compact)
    .explore-mobile-triple-grid-cell {
    width: var(--explore-mobile-card-width);
    min-width: var(--explore-mobile-card-width);
    max-width: var(--explore-mobile-card-width);
  }
}
</style>
