<script setup lang="ts">
import ExploreSkeletonBar from '~/components/explore/ExploreSkeletonBar.vue';
</script>

<template>
  <div class="flex flex-col gap-1" aria-busy="true" aria-label="Loading greeting">
    <ExploreSkeletonBar class="h-[1.35rem] w-[min(100%,14rem)] rounded-md bg-grey-100" />
    <ExploreSkeletonBar class="h-3.5 w-[min(100%,9rem)] bg-grey-100" />
  </div>
</template>
