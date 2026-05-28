<script setup lang="ts">
import ExploreLastOrderCard from '~/components/explore/ExploreLastOrderCard.vue';
import ExploreLastOrderCardSkeleton from '~/components/explore/ExploreLastOrderCardSkeleton.vue';
import ExplorePageHeroGreetingSkeleton from '~/components/explore/ExplorePageHeroGreetingSkeleton.vue';
import ExploreProcurementInsightCard from '~/components/explore/ExploreProcurementInsightCard.vue';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useExploreHeroStats } from '~/composables/useExploreHeroStats';
import { useExploreLastOrder } from '~/composables/useExploreLastOrder';
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

    <div class="mt-6 flex flex-col gap-4 lg:flex-row lg:items-stretch">
      <div class="min-w-0 w-full lg:w-[37.5%] lg:max-w-[37.5%]">
        <ExploreLastOrderCard v-if="lastOrder" :order="lastOrder" />
        <ExploreLastOrderCardSkeleton v-else-if="lastOrderSkeleton" />
        <article
          v-else-if="lastOrderLoaded"
          class="flex h-full flex-col rounded-[24px] border border-dashed border-grey-100 bg-grey-55/50 p-5"
        >
          <p class="text-base font-semibold text-grey-900">
            No recent orders yet
          </p>
          <p class="mt-1 text-sm text-grey-300">
            Your last basket will appear here after your branch places an order.
          </p>
        </article>
      </div>

      <div class="min-w-0 w-full lg:w-[37.5%] lg:max-w-[37.5%]">
        <ExploreProcurementInsightCard />
      </div>
    </div>
  </header>
</template>
