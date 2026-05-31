<script setup lang="ts">
import ExploreSkeletonBar from '~/components/explore/ExploreSkeletonBar.vue';

withDefaults(
  defineProps<{
    heightClass?: string;
  }>(),
  {
    heightClass: 'h-[260px]',
  },
);
</script>

<template>
  <div class="mt-4 space-y-3" aria-busy="true" aria-label="Loading chart">
    <ExploreSkeletonBar :class="heightClass" />
  </div>
</template>
