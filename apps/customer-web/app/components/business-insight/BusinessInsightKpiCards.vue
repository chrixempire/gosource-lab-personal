<script setup lang="ts">
import ExploreSkeletonBar from '~/components/explore/ExploreSkeletonBar.vue';
import { formatNaira } from '~/composables/useMarketplaceCart';

defineProps<{
  totalSpend: number;
  orderCount: number;
  averageOrderValue: number;
  pending?: boolean;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <template v-if="pending">
      <article
        v-for="index in 3"
        :key="index"
        class="customer-surface-card rounded-[16px] p-4"
        aria-busy="true"
      >
        <ExploreSkeletonBar class="h-3 w-24" />
        <ExploreSkeletonBar class="mt-3 h-7 w-28" />
      </article>
    </template>

    <template v-else>
      <article class="customer-surface-card rounded-[16px] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-grey-300">Total spend</p>
        <p class="mt-2 text-xl font-bold tabular-nums text-grey-900">
          {{ formatNaira(totalSpend) }}
        </p>
      </article>

      <article class="customer-surface-card rounded-[16px] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-grey-300">Total orders</p>
        <p class="mt-2 text-xl font-bold tabular-nums text-grey-900">
          {{ orderCount }}
        </p>
      </article>

      <article class="customer-surface-card rounded-[16px] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-grey-300">
          Average order value
        </p>
        <p class="mt-2 text-xl font-bold tabular-nums text-grey-900">
          {{ formatNaira(averageOrderValue) }}
        </p>
      </article>
    </template>
  </div>
</template>
