<script setup lang="ts">
import ExploreSkeletonBar from '~/components/explore/ExploreSkeletonBar.vue';
</script>

<template>
  <article
    class="h-full rounded-[24px] border border-grey-50 bg-background-on-canvas p-5 shadow-sm transition-colors duration-300"
    aria-busy="true"
    aria-label="Loading procurement insight"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-2">
        <ExploreSkeletonBar class="h-5 w-40" />
        <ExploreSkeletonBar class="h-4 w-full max-w-[15rem]" />
        <ExploreSkeletonBar class="h-4 w-24" />
      </div>
      <ExploreSkeletonBar class="h-4 w-16 shrink-0" />
    </div>

    <div class="mt-5 space-y-3">
      <div v-for="index in 4" :key="index">
        <div class="mb-1.5 flex justify-between gap-2">
          <ExploreSkeletonBar class="h-3 w-24" />
          <ExploreSkeletonBar class="h-3 w-8" />
        </div>
        <ExploreSkeletonBar class="h-2 w-full rounded-full" />
      </div>
    </div>
  </article>
</template>
