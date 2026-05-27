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
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollerState() {
  const scroller = scrollerRef.value;
  if (!scroller) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  canScrollLeft.value = scroller.scrollLeft > 1;
  canScrollRight.value = scroller.scrollLeft < maxLeft - 1;
}

function scrollByDirection(direction: -1 | 1) {
  const scroller = scrollerRef.value;
  if (!scroller) return;

  const amount = Math.max(180, Math.floor(scroller.clientWidth * 0.75));
  scroller.scrollTo({
    left: scroller.scrollLeft + direction * amount,
    behavior: 'smooth',
  });
}

onMounted(() => {
  nextTick(() => {
    updateScrollerState();
    const scroller = scrollerRef.value;
    if (!scroller) return;

    scroller.addEventListener('scroll', updateScrollerState, { passive: true });
    window.addEventListener('resize', updateScrollerState, { passive: true });
  });
});

watch(
  () => visibleProducts.value.length,
  () => nextTick(updateScrollerState),
);
</script>

<template>
  <section
    v-if="loading || visibleProducts.length > 0"
    class="mb-8 mt-6 overflow-hidden rounded-[16px] border border-primary-500/35 bg-white"
  >
    <header class="flex items-center justify-between gap-3 bg-primary-500 px-4 py-3 sm:px-5">
      <div class="flex min-w-0 items-center gap-2">
        <h2 class="truncate text-base font-semibold text-white sm:text-lg">
          Deals combo for you
        </h2>
        <span
          v-if="headerIconHtml"
          class="inline-flex size-4 shrink-0 items-center justify-center text-white"
          v-html="headerIconHtml"
        />
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          class="inline-flex size-7 items-center justify-center rounded-full border border-white/30 text-white transition disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="!canScrollLeft"
          aria-label="Scroll promotions left"
          @click="scrollByDirection(-1)"
        >
          <ChevronLeft class="size-4" />
        </button>
        <button
          type="button"
          class="inline-flex size-7 items-center justify-center rounded-full border border-white/30 text-white transition disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="!canScrollRight"
          aria-label="Scroll promotions right"
          @click="scrollByDirection(1)"
        >
          <ChevronRight class="size-4" />
        </button>
      </div>
    </header>

    <div
      v-if="loading && visibleProducts.length === 0"
      class="mt-3 flex gap-4 overflow-x-auto px-4 pb-4 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
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
      class="mt-3 flex gap-4 overflow-x-auto px-4 pb-4 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
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
