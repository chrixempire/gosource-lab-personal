<script setup lang="ts">
import type { MarketProduct, MarketPromotion } from '~/lib/marketplace-data';
import { useMediaQuery } from '@vueuse/core';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';
import {
  EXPLORE_MOBILE_PRODUCT_CARD_GAP_PX,
  EXPLORE_MOBILE_PRODUCT_CARD_WIDTH_PX,
  exploreMobileTripleScrollMediaQuery,
} from '~/lib/explore-product-layout';

// Renders a single promotion as its own row: its title, its symbol/icon, and
// its products. The parent renders one of these per active promotion.
const props = defineProps<{
  promotion: MarketPromotion;
}>();

const promotionTitle = computed(
  () => props.promotion.name?.trim() || 'Promotion',
);
const headerIconHtml = computed(() => props.promotion.icon?.trim() ?? '');

const visibleProducts = computed(() => {
  const deduped = new Map<string, MarketProduct>();
  for (const product of props.promotion.products ?? []) {
    if (product?.id && !deduped.has(product.id)) {
      deduped.set(product.id, product);
    }
  }
  return [...deduped.values()].slice(0, 20);
});

const isNarrowMobile = useMediaQuery(exploreMobileTripleScrollMediaQuery);

const scrollerRef = ref<HTMLElement | null>(null);
const canScrollProducts = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollerState() {
  const scroller = scrollerRef.value;
  if (!scroller) {
    canScrollProducts.value = false;
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const { scrollLeft, scrollWidth, clientWidth } = scroller;
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

  canScrollProducts.value = scrollWidth > clientWidth + 2;
  canScrollLeft.value = scrollLeft > 1;
  canScrollRight.value = scrollLeft < maxScrollLeft - 1;
}

function scrollByDirection(direction: -1 | 1) {
  if (direction === -1 && !canScrollLeft.value) {
    return;
  }

  if (direction === 1 && !canScrollRight.value) {
    return;
  }

  const scroller = scrollerRef.value;
  if (!scroller) {
    return;
  }

  const amount = isNarrowMobile.value
    ? EXPLORE_MOBILE_PRODUCT_CARD_WIDTH_PX + EXPLORE_MOBILE_PRODUCT_CARD_GAP_PX
    : Math.max(180, Math.floor(scroller.clientWidth * 0.75));
  scroller.scrollTo({
    left: scroller.scrollLeft + direction * amount,
    behavior: 'smooth',
  });
}

function scheduleScrollerStateUpdate() {
  nextTick(() => {
    updateScrollerState();
    requestAnimationFrame(updateScrollerState);
  });
}

let resizeObserver: ResizeObserver | null = null;
let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

function onScrollerScroll() {
  updateScrollerState();
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer);
  }
  scrollEndTimer = setTimeout(updateScrollerState, 120);
}

function attachScrollerListeners(scroller: HTMLElement) {
  scroller.addEventListener('scroll', onScrollerScroll, { passive: true });
  scroller.addEventListener('scrollend', onScrollerScroll, { passive: true });
}

function detachScrollerListeners(scroller: HTMLElement | null) {
  if (!scroller) {
    return;
  }

  scroller.removeEventListener('scroll', onScrollerScroll);
  scroller.removeEventListener('scrollend', onScrollerScroll);
}

watch(scrollerRef, (scroller, previousScroller) => {
  detachScrollerListeners(previousScroller);
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (!scroller) {
    canScrollProducts.value = false;
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  attachScrollerListeners(scroller);
  resizeObserver = new ResizeObserver(() => {
    updateScrollerState();
  });
  resizeObserver.observe(scroller);
  scheduleScrollerStateUpdate();
});

onMounted(() => {
  scheduleScrollerStateUpdate();
  window.addEventListener('resize', updateScrollerState, { passive: true });
});

onUnmounted(() => {
  detachScrollerListeners(scrollerRef.value);
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer);
  }
  window.removeEventListener('resize', updateScrollerState);
});

watch(
  () => visibleProducts.value.length,
  () => scheduleScrollerStateUpdate(),
);
</script>

<template>
  <section
    v-if="visibleProducts.length > 0"
    class="m-0"
  >
    <header
      class="mb-3 flex items-center justify-between gap-2 rounded-lg bg-primary-50 p-2"
    >
      <div class="flex min-w-0 items-center gap-1.5 pl-2">
        <h4 class="truncate text-sm font-semibold text-success-700">
          {{ promotionTitle }}
        </h4>
        <span
          v-if="headerIconHtml"
          class="inline-flex size-4 shrink-0 items-center justify-center text-primary-500 [&_svg]:size-4"
          v-html="headerIconHtml"
        />
      </div>

      <div v-if="canScrollProducts" class="flex shrink-0 gap-1">
        <button
          type="button"
          class="customer-control-btn flex size-7 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!canScrollLeft"
          aria-label="Scroll promotions left"
          @click="scrollByDirection(-1)"
        >
          <ChevronLeft class="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="customer-control-btn flex size-7 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!canScrollRight"
          aria-label="Scroll promotions right"
          @click="scrollByDirection(1)"
        >
          <ChevronRight class="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div
      ref="scrollerRef"
      class="explore-promotions-scroller"
    >
      <div
        v-for="product in visibleProducts"
        :key="product.id"
        class="explore-promotions-card-slot text-left"
      >
        <ExploreProductCard :product="product" percentage-badge-only />
      </div>
    </div>
  </section>
</template>

<style scoped>
.explore-promotions-scroller {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 0.25rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.explore-promotions-scroller::-webkit-scrollbar {
  display: none;
}

.explore-promotions-card-slot {
  width: 220px;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .explore-promotions-scroller {
    gap: 0.75rem;
  }

  .explore-promotions-card-slot {
    width: 11.375rem;
  }
}
</style>
