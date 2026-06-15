<script setup lang="ts">
import { BarChart3, Percent, ShoppingBag } from 'lucide-vue-next';
import {
  MARKETPLACE_BANNER_ROTATE_MS,
  type MarketplaceBannerImage,
} from '~/lib/marketplace-banner-images';
import {
  getMarketBannerThemeStyles,
  MARKET_BANNER_SLIDES,
} from '~/lib/market-banners';

const props = withDefaults(
  defineProps<{
    imageBanners?: MarketplaceBannerImage[];
  }>(),
  {
    imageBanners: () => [],
  },
);

const hasImageBanners = computed(() => props.imageBanners.length > 0);

const slideCount = computed(() =>
  hasImageBanners.value ? props.imageBanners.length : MARKET_BANNER_SLIDES.length,
);

const activeIndex = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

function goTo(index: number) {
  const count = slideCount.value;
  if (count === 0) {
    return;
  }

  activeIndex.value = ((index % count) + count) % count;
}

function startTimer() {
  stopTimer();
  if (slideCount.value <= 1) {
    return;
  }

  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % slideCount.value;
  }, MARKETPLACE_BANNER_ROTATE_MS);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

watch(slideCount, () => {
  if (activeIndex.value >= slideCount.value) {
    activeIndex.value = 0;
  }
  startTimer();
});

onMounted(startTimer);
onUnmounted(stopTimer);
</script>

<template>
  <div
    class="-mx-4 w-[calc(100%+2rem)] min-w-0 sm:-mx-5 sm:w-[calc(100%+2.5rem)] lg:mx-0 lg:w-full"
    @mouseenter="stopTimer"
    @mouseleave="startTimer"
  >
    <div class="relative w-full min-w-0 overflow-hidden rounded-none sm:rounded-[16px] lg:rounded-[16px]">
      <div
        class="flex w-full transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <template v-if="hasImageBanners">
          <component
            :is="banner.linkUrl ? 'NuxtLink' : 'div'"
            v-for="banner in imageBanners"
            :key="banner.id"
            :to="banner.linkUrl ?? undefined"
            :aria-label="banner.alt"
            class="relative block w-full min-w-0 shrink-0 grow-0 basis-full overflow-hidden no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 sm:rounded-[16px]"
          >
            <div class="relative h-[300px] max-h-[300px] w-full bg-grey-55">
              <img
                :src="banner.imageUrl"
                :alt="banner.alt"
                class="size-full object-cover"
                loading="lazy"
              >
            </div>
          </component>
        </template>

        <template v-else>
          <NuxtLink
            v-for="slide in MARKET_BANNER_SLIDES"
            :key="slide.id"
            :to="slide.to"
            :aria-label="slide.alt"
            class="relative block w-full min-w-0 shrink-0 grow-0 basis-full cursor-pointer overflow-hidden no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 sm:rounded-[16px]"
          >
            <div
              class="relative flex min-h-[7.5rem] w-full items-stretch overflow-hidden sm:min-h-[9.375rem]"
              :class="getMarketBannerThemeStyles(slide.theme).panel"
            >
              <div
                class="pointer-events-none absolute -right-6 top-1/2 size-32 -translate-y-1/2 rounded-full bg-white/10 blur-2xl sm:-right-4 sm:size-40"
                aria-hidden="true"
              />

              <div
                class="relative z-10 flex min-w-0 flex-1 items-center gap-2 py-3 pl-3.5 pr-2 sm:gap-4 sm:py-4 sm:pl-5 sm:pr-4"
              >
                <div class="min-w-0 flex-1">
                  <h2 class="text-[1.0625rem] font-bold leading-[1.2] tracking-tight text-white sm:text-[1.625rem]">
                    {{ slide.title }}
                  </h2>
                  <p
                    class="mt-1 line-clamp-2 text-[11px] font-medium leading-snug sm:mt-1.5 sm:text-[0.9375rem] sm:leading-normal"
                    :class="getMarketBannerThemeStyles(slide.theme).subtitle"
                  >
                    {{ slide.subtitle }}
                  </p>
                  <span
                    class="mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold sm:mt-3 sm:px-3.5 sm:py-1.5 sm:text-sm"
                    :class="getMarketBannerThemeStyles(slide.theme).cta"
                  >
                    {{ slide.cta }}
                  </span>
                </div>

                <div
                  class="flex shrink-0 items-center justify-center pr-0.5 sm:pr-1"
                  aria-hidden="true"
                >
                  <div
                    v-if="slide.theme === 'deals'"
                    class="flex size-[4.25rem] flex-col items-center justify-center rounded-full bg-[#F79009]/20 sm:size-[5.5rem]"
                  >
                    <Percent class="size-7 text-[#FDB022] sm:size-9" stroke-width="2.5" />
                    <span class="-mt-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-100 sm:text-xs">
                      Off
                    </span>
                  </div>
                  <BarChart3
                    v-else-if="slide.theme === 'insight'"
                    class="size-14 opacity-90 sm:size-[4.5rem]"
                    :class="getMarketBannerThemeStyles(slide.theme).decor"
                    stroke-width="1.25"
                  />
                  <ShoppingBag
                    v-else
                    class="size-14 text-white/25 opacity-90 sm:size-[4.5rem]"
                    stroke-width="1.25"
                  />
                </div>
              </div>
            </div>
          </NuxtLink>
        </template>
      </div>
    </div>

    <div
      v-if="slideCount > 1"
      class="mt-2 flex items-center justify-center gap-1.5 sm:mt-3 sm:gap-2"
      role="tablist"
      aria-label="Banner slides"
    >
      <button
        v-for="(_, index) in slideCount"
        :key="`dot-${index}`"
        type="button"
        class="h-2 cursor-pointer rounded-full bg-grey-300 transition-all duration-300 ease-out dark:bg-grey-50"
        :class="activeIndex === index ? 'w-6 bg-primary-500 dark:bg-primary-500/80' : 'w-2'"
        :aria-label="`Show banner ${index + 1}`"
        :aria-selected="activeIndex === index"
        role="tab"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>
