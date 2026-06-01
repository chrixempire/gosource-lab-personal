<script setup lang="ts">
import type { MarketCategory } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';
import ExploreProductResponsiveGrid from '~/components/explore/ExploreProductResponsiveGrid.vue';

const props = withDefaults(
  defineProps<{
    category: MarketCategory;
    /** `rail`: horizontal scroll on desktop. `grid`: wrapped list (category page). */
    layout?: 'rail' | 'grid';
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
    <div
      v-if="isRail"
      class="mb-4 flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-end min-[720px]:justify-end"
    >
      <div class="flex shrink-0 items-center gap-2 self-end min-[720px]:self-auto">
        <NuxtLink
          :to="`/market/category/${category.id}`"
          class="text-sm font-semibold text-grey-900 underline-offset-4 transition hover:text-primary-500 hover:underline"
        >
          View all ({{ category.products.length }})
          <span aria-hidden="true" class="inline">&nbsp;›</span>
        </NuxtLink>
        <div v-if="canScrollProducts" class="hidden gap-1 min-[900px]:flex">
          <button
            type="button"
            class="customer-control-btn flex size-9 shadow-sm"
            :disabled="!canScrollLeft"
            aria-label="Scroll products left"
            @click="scrollProducts(-260)"
          >
            <ChevronLeft class="size-5" />
          </button>
          <button
            type="button"
            class="customer-control-btn flex size-9 shadow-sm"
            :disabled="!canScrollRight"
            aria-label="Scroll products right"
            @click="scrollProducts(260)"
          >
            <ChevronRight class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <ExploreProductResponsiveGrid
      v-if="isRail"
      :products="category.products"
      class="min-[900px]:hidden"
    />

    <div
      v-if="isRail"
      ref="rail"
      class="hidden touch-pan-x gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] min-[900px]:flex [&::-webkit-scrollbar]:hidden"
      @scroll.passive="updateProductScrollHints"
    >
      <div
        v-for="p in category.products"
        :key="p.id"
        class="w-[220px] shrink-0"
      >
        <ExploreProductCard :product="p" />
      </div>
    </div>

    <ExploreProductResponsiveGrid
      v-else
      :products="category.products"
    />
  </section>
</template>
