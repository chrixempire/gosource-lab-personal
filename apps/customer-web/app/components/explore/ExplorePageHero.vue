<script setup lang="ts">
import ExploreMarketBannerCarousel from '~/components/explore/ExploreMarketBannerCarousel.vue';
import ExplorePageHeroGreetingSkeleton from '~/components/explore/ExplorePageHeroGreetingSkeleton.vue';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useExploreHeroStats } from '~/composables/useExploreHeroStats';
defineProps<{
  greetingName: string;
  outletLabel: string;
  sessionLoading?: boolean;
}>();

const { ordersLabel, walkInSavingsNaira, loading: heroStatsLoading } = useExploreHeroStats();
const {
  lastOrder,
  loaded: lastOrderLoaded,
  showSkeleton: lastOrderSkeleton,
} = useExploreLastOrder();

const savingsLabel = computed(() => formatNaira(walkInSavingsNaira.value));
</script>

<template>
  <header class="mb-5 pt-5 sm:pt-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-h-[4.25rem] min-w-0">
        <ExplorePageHeroGreetingSkeleton v-if="sessionLoading" />
        <template v-else>
          <h1 class="text-2xl font-semibold leading-tight tracking-tight text-grey-900 sm:text-[1.75rem]">
            Good morning,
            <span class="text-primary-600">{{ greetingName }}.</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-grey-900">
            {{ outletLabel }}
          </p>
        </template>
      </div>

      <div class="shrink-0 text-left lg:text-right">
        <p
          class="text-lg font-semibold tracking-tight text-grey-900 sm:text-xl"
          :class="{ 'animate-pulse text-grey-200': heroStatsLoading || sessionLoading }"
        >
          {{ heroStatsLoading || sessionLoading ? '—' : ordersLabel }}
        </p>
        <p class="mt-1 text-sm text-grey-300">
          <template v-if="heroStatsLoading || sessionLoading">
            Loading monthly summary…
          </template>
          <template v-else>
            this month · saving {{ savingsLabel }} vs walk-in
          </template>
        </p>
      </div>
    </div>

    <div class="mt-6 w-full">
      <ExploreMarketBannerCarousel />
    </div>
  </header>
</template>
