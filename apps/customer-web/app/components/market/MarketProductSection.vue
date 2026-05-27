<script setup lang="ts">
import type { MarketCategory } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';
import MarketProductImage from './MarketProductImage.vue';

const props = withDefaults(
  defineProps<{
    category: MarketCategory;
    /** `rail`: horizontal scroll (market index). `grid`: wrapped full-width list (category page). */
    layout?: 'rail' | 'grid';
    /** When false, scroll anchor id lives on a parent (lazy market index sections). */
    anchorSection?: boolean;
  }>(),
  { layout: 'rail', anchorSection: true },
);

const isRail = computed(() => props.layout === 'rail');

const rail = ref<HTMLElement | null>(null);
const canScrollProducts = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateProductScrollHints() {
  if (!isRail.value) {
    return;
  }
  const el = rail.value;
  if (!el) {
    return;
  }
  const { scrollLeft, scrollWidth, clientWidth } = el;
  canScrollProducts.value = scrollWidth > clientWidth + 2;
  canScrollLeft.value = scrollLeft > 4;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 4;
}

function scrollProducts(delta: number) {
  rail.value?.scrollBy({ left: delta, behavior: 'smooth' });
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!isRail.value) {
    return;
  }
  nextTick(() => {
    updateProductScrollHints();
    if (!rail.value) {
      return;
    }
    resizeObserver = new ResizeObserver(() => {
      updateProductScrollHints();
    });
    resizeObserver.observe(rail.value);
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => [props.category.products.length, props.layout] as const,
  () => {
    if (isRail.value) {
      nextTick(updateProductScrollHints);
    }
  },
);
</script>

<template>
  <section
    :id="anchorSection ? `market-section-${category.id}` : undefined"
    :data-category-id="category.id"
    :class="[
      'border-b border-grey-50/80 pb-5 pt-2 last:border-b-0',
      anchorSection && isRail ? 'scroll-mt-[148px] lg:scroll-mt-[172px]' : '',
    ]"
  >
    <div class="mb-4 flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-between">
      <div class="flex min-w-0 items-start gap-3">
        <div
          class="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-grey-50 bg-white shadow-sm"
          aria-hidden="true"
        >
          <MarketProductImage
            v-if="category.imageUrl"
            :src="category.imageUrl"
            :alt="category.title"
            :hover-zoom="false"
            logo-class="h-8 w-8"
          />
          <span
            v-else-if="category.emoji"
            class="text-3xl leading-none"
            aria-hidden="true"
          >
            {{ category.emoji }}
          </span>
          <img
            v-else
            src="/images/logo.png"
            alt=""
            class="h-8 w-8 animate-pulse object-contain grayscale"
            aria-hidden="true"
          >
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-grey-900 sm:text-xl">
            {{ category.title }}
          </h2>
          <p class="mt-0.5 text-sm font-medium text-grey-900">
            {{ category.sectionTitle }}
          </p>
          <p class="mt-0.5 text-sm leading-snug text-grey-300">
            {{ category.sectionDescription }}
          </p>
        </div>
      </div>

      <div
        v-if="isRail"
        class="flex shrink-0 items-center gap-2 self-end min-[720px]:self-auto"
      >
        <NuxtLink
          :to="`/market/category/${category.id}`"
          class="text-sm font-semibold text-grey-900 underline-offset-4 transition hover:text-primary-500 hover:underline"
        >
          View all ({{ category.products.length }})
          <span aria-hidden="true" class="inline">&nbsp;›</span>
        </NuxtLink>
        <div v-if="canScrollProducts" class="flex gap-1">
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 shadow-sm transition hover:bg-primary-50/70 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-grey-900"
            :disabled="!canScrollLeft"
            aria-label="Scroll products left"
            @click="scrollProducts(-260)"
          >
            <ChevronLeft class="size-5" />
          </button>
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 shadow-sm transition hover:bg-primary-50/70 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-grey-900"
            :disabled="!canScrollRight"
            aria-label="Scroll products right"
            @click="scrollProducts(260)"
          >
            <ChevronRight class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <div
      ref="rail"
      :class="[
        'pb-1',
        isRail
          ? 'flex touch-pan-x gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'market-products-grid w-full min-w-0',
      ]"
      @scroll.passive="updateProductScrollHints"
    >
      <template v-if="isRail">
        <div
          v-for="p in category.products"
          :key="p.id"
          class="w-[220px] shrink-0"
        >
          <ExploreProductCard :product="p" />
        </div>
      </template>
      <ExploreProductCard
        v-for="p in category.products"
        v-else
        :key="p.id"
        :product="p"
      />
    </div>
  </section>
</template>

<style scoped>
.market-products-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .market-products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .market-products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1080px) {
  .market-products-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1240px) {
  .market-products-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
