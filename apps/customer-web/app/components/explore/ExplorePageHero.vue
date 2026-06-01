<script setup lang="ts">
import { useNow } from '@vueuse/core';
import ExploreMarketBannerCarousel from '~/components/explore/ExploreMarketBannerCarousel.vue';
import ExplorePageHeroGreetingSkeleton from '~/components/explore/ExplorePageHeroGreetingSkeleton.vue';
import { getCustomerTimeGreeting } from '~/lib/customer-time-of-day';

defineProps<{
  greetingName: string;
  sessionLoading?: boolean;
}>();

const now = useNow({ interval: 60_000 });
const timeGreeting = computed(() => getCustomerTimeGreeting(now.value));
</script>

<template>
  <header class="mb-2 pt-3 sm:mb-2 sm:pt-6">
    <div class="flex min-h-0 min-w-0 flex-col gap-1">
      <ExplorePageHeroGreetingSkeleton v-if="sessionLoading" />
      <h1
        v-else
        class="text-[15px] font-medium leading-[1.35] tracking-tight sm:text-base"
      >
        <span class="text-grey-600">{{ timeGreeting }},</span>
        <span class="font-semibold text-primary-600"> {{ greetingName }}.</span>
      </h1>
    </div>

    <div class="mt-1 w-full min-w-0 sm:mt-4">
      <ExploreMarketBannerCarousel />
    </div>
  </header>
</template>
