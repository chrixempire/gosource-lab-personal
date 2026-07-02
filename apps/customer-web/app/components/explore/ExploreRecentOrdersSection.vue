<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreRecentOrderCompactCard from '~/components/explore/ExploreRecentOrderCompactCard.vue';

const props = defineProps<{
  products: MarketProduct[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [product: MarketProduct];
}>();

const visibleProducts = computed(() => props.products);

/** One visible column in a 4-up row (gap-3 = 0.75rem × 3 gutters). */
const recentOrderCardWidthClass =
  'w-[calc((100%-2.25rem)/4)] min-w-[200px] shrink-0 sm:min-w-[220px]';

const scrollerRef = ref<HTMLElement | null>(null);
const canScroll = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollHints() {
  const scroller = scrollerRef.value;
  if (!scroller) {
    canScroll.value = false;
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const { scrollLeft, scrollWidth, clientWidth } = scroller;
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

  canScroll.value = scrollWidth > clientWidth + 2;
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

  const amount = Math.max(280, Math.floor(scroller.clientWidth * 0.8));
  scroller.scrollTo({
    left: scroller.scrollLeft + direction * amount,
    behavior: 'smooth',
  });
}

function scheduleScrollHintsUpdate() {
  nextTick(() => {
    updateScrollHints();
    requestAnimationFrame(updateScrollHints);
  });
}

let resizeObserver: ResizeObserver | null = null;
let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

function onScrollerScroll() {
  updateScrollHints();
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer);
  }
  scrollEndTimer = setTimeout(updateScrollHints, 120);
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
    canScroll.value = false;
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  attachScrollerListeners(scroller);
  resizeObserver = new ResizeObserver(() => {
    updateScrollHints();
  });
  resizeObserver.observe(scroller);
  scheduleScrollHintsUpdate();
});

watch(
  () => [visibleProducts.value.length, props.loading] as const,
  () => scheduleScrollHintsUpdate(),
);

onMounted(() => scheduleScrollHintsUpdate());

onUnmounted(() => {
  detachScrollerListeners(scrollerRef.value);
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer);
  }
});
</script>

<template>
  <section
    v-if="loading || visibleProducts.length > 0"
    class="m-0"
    data-testid="explore-recent-orders-section"
  >
    <header
      class="mb-3 flex items-center justify-between gap-2 px-1 sm:px-0"
    >
      <h2 class="min-w-0 truncate text-[15px] font-medium leading-[1.35] tracking-tight text-grey-900 sm:text-base">
        <span class="min-[720px]:hidden">Recently ordered</span>
        <span class="hidden min-[720px]:inline">Recently ordered items</span>
      </h2>

      <div class="flex shrink-0 items-center gap-2">
        <NuxtLink
          to="/market/recent-orders"
          class="text-sm font-semibold text-grey-900 underline-offset-4 transition hover:text-primary-500 hover:underline"
        >
          <span class="min-[720px]:hidden">View all</span>
          <span class="hidden min-[720px]:inline">
            View all ({{ visibleProducts.length }})
          </span>
          <span aria-hidden="true" class="inline">&nbsp;›</span>
        </NuxtLink>

        <div v-if="canScroll" class="flex gap-1">
          <button
            type="button"
            class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
            :disabled="!canScrollLeft"
            aria-label="Scroll recent orders left"
            @click="scrollByDirection(-1)"
          >
            <ChevronLeft class="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
            :disabled="!canScrollRight"
            aria-label="Scroll recent orders right"
            @click="scrollByDirection(1)"
          >
            <ChevronRight class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <div
      ref="scrollerRef"
      class="flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <template v-if="loading && visibleProducts.length === 0">
        <div
          v-for="index in 4"
          :key="index"
          :class="[
            recentOrderCardWidthClass,
            'h-[72px] animate-pulse rounded-[8px] border border-grey-50 bg-grey-55',
          ]"
        />
      </template>
      <template v-else>
        <div
          v-for="product in visibleProducts"
          :key="product.id"
          :class="recentOrderCardWidthClass"
        >
          <ExploreRecentOrderCompactCard
            :product="product"
            @select="emit('select', $event)"
          />
        </div>
      </template>
    </div>
  </section>
</template>
