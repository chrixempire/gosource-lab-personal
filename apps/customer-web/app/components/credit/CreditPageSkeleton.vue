<script setup lang="ts">
import CreditAccountOverviewSkeleton from '~/components/credit/CreditAccountOverviewSkeleton.vue';
import CreditHistoryTableSkeleton from '~/components/credit/CreditHistoryTableSkeleton.vue';
import CreditHistoryToolbarSkeleton from '~/components/credit/CreditHistoryToolbarSkeleton.vue';
import CreditSkeletonBar from '~/components/credit/CreditSkeletonBar.vue';
import CreditUpcomingBannerSkeleton from '~/components/credit/CreditUpcomingBannerSkeleton.vue';

withDefaults(
  defineProps<{
    tableRowCount?: number;
  }>(),
  {
    tableRowCount: 8,
  },
);
</script>

<template>
  <div
    class="flex flex-col gap-1.5"
    aria-busy="true"
    aria-live="polite"
    aria-label="Loading credit"
  >
    <div class="flex flex-wrap items-center gap-6">
      <CreditUpcomingBannerSkeleton />
      <div class="ml-auto flex shrink-0 flex-wrap items-center gap-2" aria-hidden="true">
        <CreditSkeletonBar class="h-9 w-32 rounded-[10px]" />
        <CreditSkeletonBar class="h-9 w-28 rounded-[10px]" />
      </div>
    </div>

    <CreditAccountOverviewSkeleton />

    <div class="space-y-4 pt-2">
      <CreditHistoryToolbarSkeleton />
      <CreditHistoryTableSkeleton :row-count="tableRowCount" />
    </div>
  </div>
</template>
