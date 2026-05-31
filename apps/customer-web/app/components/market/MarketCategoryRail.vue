<script setup lang="ts">
import type { MarketCategory } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import MarketProductImage from './MarketProductImage.vue';

const props = defineProps<{
  categories: MarketCategory[];
  activeId: string;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const scroller = ref<HTMLElement | null>(null);
const itemRefs = ref<Record<string, HTMLElement | null>>({});

function setItemRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (!el) {
    delete itemRefs.value[id];
    return;
  }
  itemRefs.value[id] = el as HTMLElement;
}

const canScroll = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollHints() {
  const el = scroller.value;
  if (!el) {
    return;
  }
  const { scrollLeft, scrollWidth, clientWidth } = el;
  canScroll.value = scrollWidth > clientWidth + 2;
  canScrollLeft.value = scrollLeft > 4;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 4;
}

function scrollBy(delta: number) {
  scroller.value?.scrollBy({ left: delta, behavior: 'smooth' });
}

function scrollActiveIntoView() {
  nextTick(() => {
    const el = itemRefs.value[props.activeId];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    requestAnimationFrame(updateScrollHints);
  });
}

defineExpose({ scrollActiveIntoView });

watch(
  () => props.categories.length,
  () => {
    nextTick(updateScrollHints);
  },
);

watch(
  () => props.activeId,
  () => {
    nextTick(updateScrollHints);
  },
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => {
    updateScrollHints();
    if (!scroller.value) {
      return;
    }
    resizeObserver = new ResizeObserver(() => {
      updateScrollHints();
    });
    resizeObserver.observe(scroller.value);
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<template>
  <div
    data-testid="market-category-rail"
    class="flex w-full min-w-0 items-center"
    :class="canScroll ? 'gap-2' : ''"
  >
    <button
      v-if="canScroll"
      type="button"
      class="customer-control-btn flex size-9 shrink-0 shadow-sm"
      :disabled="!canScrollLeft"
      aria-label="Scroll categories left"
      @click="scrollBy(-220)"
    >
      <ChevronLeft class="size-5" />
    </button>

    <div
      ref="scroller"
      class="scrollbar-thin flex min-w-0 flex-1 touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      @scroll.passive="updateScrollHints"
    >
      <button
        v-for="cat in categories"
        :key="cat.id"
        :ref="(el) => setItemRef(cat.id, el)"
        :data-testid="`market-category-${cat.id}`"
        type="button"
        class="group flex shrink-0 cursor-pointer snap-center flex-col items-center gap-1.5 px-1 pb-1 pt-0.5 text-center transition"
        :aria-current="activeId === cat.id ? 'true' : undefined"
        @click="emit('select', cat.id)"
      >
        <span
          :class="[
            'relative flex size-[52px] items-center justify-center overflow-hidden rounded-full border-2 bg-background-on-canvas transition-colors duration-300',
            activeId === cat.id
              ? 'border-primary-500 !bg-primary-50/70 shadow-[0_6px_16px_-8px_rgba(4,85,11,0.35)]'
              : 'border-transparent bg-background-on-canvas shadow-[var(--customer-card-shadow)] group-hover:border-primary-500/35 group-hover:bg-primary-50/70',
          ]"
        >
          <MarketProductImage
            v-if="cat.imageUrl"
            :src="cat.imageUrl"
            :alt="cat.title"
            :hover-zoom="false"
            logo-class="h-8 w-8"
          />
          <span
            v-else-if="cat.emoji"
            class="text-2xl leading-none"
            aria-hidden="true"
          >
            {{ cat.emoji }}
          </span>
          <img
            v-else
            src="/images/logo.png"
            alt=""
            class="h-8 w-8 animate-pulse object-contain grayscale"
            aria-hidden="true"
          >
        </span>
        <span
          class="max-w-[4.75rem] truncate text-[11px] font-medium leading-tight text-grey-900 group-hover:text-primary-500"
          :class="activeId === cat.id ? 'text-primary-500' : 'text-grey-300'"
        >
          {{ cat.title }}
        </span>
      </button>
    </div>

    <button
      v-if="canScroll"
      type="button"
      class="customer-control-btn flex size-9 shrink-0 shadow-sm"
      :disabled="!canScrollRight"
      aria-label="Scroll categories right"
      @click="scrollBy(220)"
    >
      <ChevronRight class="size-5" />
    </button>
  </div>
</template>
