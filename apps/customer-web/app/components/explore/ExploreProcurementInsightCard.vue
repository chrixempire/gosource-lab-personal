<script setup lang="ts">
import ExploreProcurementInsightCardSkeleton from '~/components/explore/ExploreProcurementInsightCardSkeleton.vue';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useExploreProcurementInsight } from '~/composables/useExploreProcurementInsight';

const { rows, totalSpent, periodLabel, hasData, showSkeleton, loaded } =
  useExploreProcurementInsight();
</script>

<template>
  <ExploreProcurementInsightCardSkeleton v-if="showSkeleton" />

  <article
    v-else-if="hasData"
    class="flex h-full flex-col rounded-[24px] border border-grey-50 bg-background-on-canvas p-5 transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-1"
  >
    <div class="space-y-1">
      <div class="flex items-start justify-between gap-3">
        <p class="text-base font-semibold text-grey-900">
          Procurement Insight
        </p>
        <NuxtLink
          to="/track-orders?tab=insight"
          class="inline-flex shrink-0 items-center rounded-sm text-sm font-semibold text-primary-500 underline-offset-4 transition-colors hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        >
          Full report
        </NuxtLink>
      </div>

      <div class="flex items-baseline justify-between gap-3">
        <p class="min-w-0 text-sm text-grey-300">
          Your monthly spending breakdown · {{ periodLabel }}
        </p>
        <p class="shrink-0 text-sm font-semibold tabular-nums text-grey-900">
          {{ formatNaira(totalSpent) }} total
        </p>
      </div>
    </div>

    <div class="mt-4 space-y-3">
      <div v-for="row in rows" :key="row.label">
        <div class="mb-1 flex justify-between gap-2 text-xs text-grey-300">
          <span class="min-w-0 truncate">{{ row.label }}</span>
          <span class="shrink-0 tabular-nums">{{ row.percent }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-grey-55">
          <div
            class="h-full rounded-full transition-[width] duration-300"
            :class="row.barClass"
            :style="{ width: `${Math.max(row.percent, 4)}%` }"
          />
        </div>
      </div>
    </div>
  </article>

  <article
    v-else-if="loaded"
    class="h-full rounded-[24px] border border-dashed border-grey-100 bg-grey-55/50 p-5"
  >
    <p class="text-base font-semibold text-grey-900">
      Procurement Insight
    </p>
    <p class="mt-1 text-sm text-grey-300">
      No orders placed for {{ periodLabel }} yet. Pending requests in Manage Requests are not included until they become orders.
    </p>
  </article>
</template>
