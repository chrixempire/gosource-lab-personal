<script setup lang="ts">
import ExploreSkeletonBar from '~/components/explore/ExploreSkeletonBar.vue';
</script>

<template>
  <div class="min-h-[4.25rem] space-y-2.5" aria-busy="true" aria-label="Loading greeting">
    <ExploreSkeletonBar class="h-8 w-[min(100%,16rem)] rounded-lg bg-grey-100 sm:h-9" />
    <ExploreSkeletonBar class="h-4 w-[min(100%,10rem)] bg-grey-100" />
  </div>
</template>
