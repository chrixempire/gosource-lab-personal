<script setup lang="ts">
import {
  MARKETPLACE_BANNER_ROTATE_MS,
  type MarketplaceBannerImage,
} from '~/lib/marketplace-banner-images';

const props = withDefaults(
  defineProps<{
    imageBanners?: MarketplaceBannerImage[];
  }>(),
  {
    imageBanners: () => [],
  },
);

const slideCount = computed(() => props.imageBanners.length);

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
        <component
          :is="banner.linkUrl ? 'NuxtLink' : 'div'"
          v-for="banner in imageBanners"
          :key="banner.id"
          :to="banner.linkUrl ?? undefined"
          :aria-label="banner.alt"
          class="relative block w-full min-w-0 shrink-0 grow-0 basis-full overflow-hidden no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 sm:rounded-[16px]"
        >
          <div class="relative h-[270px] max-h-[270px] w-full bg-grey-55">
            <img
              :src="banner.imageUrl"
              :alt="banner.alt"
              class="size-full object-cover"
              loading="lazy"
            >
          </div>
        </component>
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
