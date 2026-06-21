<script setup lang="ts">
import { MARKET_NEWS_RAIL_MESSAGES } from '~/lib/market-news-rail';

/** Repeat enough times so one half of the track always fills wide viewports. */
const MESSAGE_SET_REPEATS = 8;

const scrollSequence = computed(() => {
  const once: string[] = [];

  for (let repeat = 0; repeat < MESSAGE_SET_REPEATS; repeat += 1) {
    once.push(...MARKET_NEWS_RAIL_MESSAGES);
  }

  return [...once, ...once];
});
</script>

<template>
  <div
    class="customer-news-rail overflow-hidden rounded-md border border-grey-50 bg-background-on-canvas p-2.5"
    role="region"
    aria-label="Market announcements"
  >
    <div class="customer-news-rail-track flex w-max items-center gap-1 will-change-transform">
      <span
        v-for="(message, index) in scrollSequence"
        :key="index"
        class="inline-flex shrink-0 items-center gap-[6px]"
        :aria-hidden="index >= scrollSequence.length / 2 ? true : undefined"
      >
        <span class="whitespace-nowrap text-sm font-medium text-button-primary">
          {{ message }}
        </span>
        <span
          class="size-1 shrink-0 rounded-full bg-grey-300"
          aria-hidden="true"
        />
      </span>
    </div>
  </div>
</template>
