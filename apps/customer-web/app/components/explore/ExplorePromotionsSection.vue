<script setup lang="ts">
import type { MarketPromotion } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

const props = defineProps<{
  promotions: MarketPromotion[];
  loading?: boolean;
}>();

const headerIconHtml = computed(() => {
  const firstWithIcon = props.promotions.find((promotion) => promotion.icon?.trim());
  return firstWithIcon?.icon?.trim() ?? '';
});

const visibleProducts = computed(() => {
  const allProducts = props.promotions.flatMap((promotion) => promotion.products ?? []);
  const deduped = new Map<string, (typeof allProducts)[number]>();
  for (const product of allProducts) {
    if (product?.id && !deduped.has(product.id)) {
      deduped.set(product.id, product);
    }
  }
  return [...deduped.values()].slice(0, 20);
});

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

  const amount = Math.max(180, Math.floor(scroller.clientWidth * 0.75));
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
  () => [visibleProducts.value.length, props.loading] as const,
  () => scheduleScrollerStateUpdate(),
);
</script>

<template>
  <section
    v-if="loading || visibleProducts.length > 0"
    class="m-0"
  >
    <header
      class="mb-3 flex items-center justify-between gap-2 px-1 sm:px-0"
    >
      <div class="flex min-w-0 items-center gap-1.5">
        <h2 class="truncate text-base font-semibold text-grey-900 sm:text-lg">
          Deals combo for you
        </h2>
        <span
          v-if="headerIconHtml"
          class="inline-flex size-4 shrink-0 items-center justify-center text-primary-500 [&_svg]:size-4"
          v-html="headerIconHtml"
        />
      </div>

      <div v-if="canScrollProducts" class="flex shrink-0 gap-1">
        <button
          type="button"
          class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!canScrollLeft"
          aria-label="Scroll promotions left"
          @click="scrollByDirection(-1)"
        >
          <ChevronLeft class="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!canScrollRight"
          aria-label="Scroll promotions right"
          @click="scrollByDirection(1)"
        >
          <ChevronRight class="size-5" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div
      v-if="loading && visibleProducts.length === 0"
      class="flex touch-pan-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
    >
      <div
        v-for="index in 5"
        :key="index"
        class="h-[270px] w-[220px] shrink-0 animate-pulse rounded-[8px] border border-grey-50 bg-grey-55"
      />
    </div>

    <div
      v-else
      ref="scrollerRef"
      class="flex touch-pan-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
    >
      <div
        v-for="product in visibleProducts"
        :key="product.id"
        class="w-[220px] shrink-0 text-left"
      >
        <ExploreProductCard :product="product" percentage-badge-only />
      </div>
    </div>
  </section>
</template>
