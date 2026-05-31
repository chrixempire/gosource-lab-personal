<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    products: MarketProduct[];
    /** Green bordered promo block (reference market promotions). */
    variant?: 'default' | 'promotion';
    /** Optional HTML icon from legacy promotion payload. */
    iconHtml?: string;
    expandable?: boolean;
    expanded?: boolean;
  }>(),
  {
    variant: 'default',
    expandable: false,
    expanded: false,
  },
);

const emit = defineEmits<{
  'update:expanded': [value: boolean];
}>();

const isPromotion = computed(() => props.variant === 'promotion');
const showGrid = computed(() => (props.expandable ? props.expanded : false));
const displayProducts = computed(() => props.products.filter((p) => p.id));

const rail = ref<HTMLElement | null>(null);
const canScrollProducts = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateProductScrollHints() {
  if (showGrid.value) {
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

function toggleExpanded() {
  if (!props.expandable) {
    return;
  }
  emit('update:expanded', !props.expanded);
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  scheduleScrollHintUpdate();
  nextTick(() => {
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

function scheduleScrollHintUpdate() {
  nextTick(() => {
    updateProductScrollHints();
    requestAnimationFrame(() => {
      updateProductScrollHints();
    });
  });
}

watch(
  () => [displayProducts.value.length, showGrid.value, props.expanded] as const,
  () => {
    scheduleScrollHintUpdate();
  },
);

const showScrollButtons = computed(() => !showGrid.value && canScrollProducts.value);
const showHeaderActions = computed(() => props.expandable || showScrollButtons.value);
</script>

<template>
  <section
    v-if="displayProducts.length"
    :class="[
      isPromotion ? 'overflow-hidden rounded-[20px] border-2 border-primary-500 dark:border-primary-500/30' : '',
    ]"
  >
    <div
      :class="[
        'flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between',
        isPromotion ? 'customer-brand-hero px-4 py-4' : 'mb-4',
      ]"
    >
      <div class="flex min-w-0 items-center gap-2">
        <h2
          :class="[
            'font-semibold tracking-[-0.02em]',
            isPromotion
              ? 'text-[20px] leading-6 text-white'
              : 'text-[24px] leading-7 text-grey-900',
          ]"
        >
          {{ title }}
        </h2>
        <div
          v-if="iconHtml && isPromotion"
          class="text-white [&_svg]:size-6"
          v-html="iconHtml"
        />
      </div>

      <div
        v-if="showHeaderActions"
        class="flex shrink-0 items-center gap-2 self-end min-[720px]:self-auto"
      >
        <button
          v-if="expandable"
          type="button"
          :class="
            isPromotion
              ? 'cursor-pointer text-sm font-semibold text-white underline-offset-4 transition hover:underline'
              : 'cursor-pointer text-sm font-semibold text-grey-900 underline-offset-4 transition hover:text-primary-500 hover:underline'
          "
          @click="toggleExpanded"
        >
          {{ expanded ? 'Show less' : `View all (${displayProducts.length})` }}
          <span v-if="!expanded" aria-hidden="true" class="inline">&nbsp;›</span>
        </button>

        <div v-if="showScrollButtons" class="flex gap-1">
          <button
            type="button"
            :class="[
              'flex size-9 items-center justify-center rounded-full border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30',
              isPromotion
                ? 'border-white/30 bg-white/15 text-white hover:bg-white/25 disabled:hover:bg-white/15'
                : 'customer-control-btn flex size-9 shadow-sm',
            ]"
            :disabled="!canScrollLeft"
            aria-label="Scroll products left"
            @click="scrollProducts(-260)"
          >
            <ChevronLeft class="size-5" />
          </button>
          <button
            type="button"
            :class="[
              'flex size-9 items-center justify-center rounded-full border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30',
              isPromotion
                ? 'border-white/30 bg-white/15 text-white hover:bg-white/25 disabled:hover:bg-white/15'
                : 'customer-control-btn flex size-9 shadow-sm',
            ]"
            :disabled="!canScrollRight"
            aria-label="Scroll products right"
            @click="scrollProducts(260)"
          >
            <ChevronRight class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <div :class="isPromotion ? 'px-4 pb-4' : ''">
      <div
        v-if="!showGrid"
        ref="rail"
        class="flex touch-pan-x gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="updateProductScrollHints"
      >
        <div
          v-for="p in displayProducts"
          :key="p.id"
          class="w-[220px] shrink-0"
        >
          <ExploreProductCard :product="p" />
        </div>
      </div>

      <div
        v-else
        class="market-products-grid w-full min-w-0"
      >
        <ExploreProductCard
          v-for="p in displayProducts"
          :key="`grid-${p.id}`"
          :product="p"
        />
      </div>
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
