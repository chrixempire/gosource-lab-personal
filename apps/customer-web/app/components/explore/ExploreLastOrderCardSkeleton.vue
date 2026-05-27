<script setup lang="ts">
import ExploreSkeletonBar from '~/components/explore/ExploreSkeletonBar.vue';
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[24px] bg-primary-500/90 p-5 shadow-[0_20px_48px_-24px_rgba(4,85,11,0.55)]"
    aria-busy="true"
    aria-label="Loading order again"
  >
    <div class="flex items-center justify-between gap-3">
      <ExploreSkeletonBar class="h-3 w-24 bg-white/25" />
      <ExploreSkeletonBar class="h-3 w-28 bg-white/25" />
    </div>

    <ExploreSkeletonBar class="mt-4 h-6 w-[min(100%,16rem)] bg-white/30" />

    <div class="mt-4 flex items-center gap-2">
      <div class="flex -space-x-2">
        <ExploreSkeletonBar
          v-for="index in 4"
          :key="index"
          class="size-9 rounded-[10px] border-2 border-primary-500/90 bg-white/25"
        />
      </div>
      <ExploreSkeletonBar class="h-4 w-28 bg-white/25" />
    </div>

    <div class="mt-auto grid grid-cols-[minmax(0,13fr)_minmax(0,7fr)] gap-2 pt-5">
      <ExploreSkeletonBar class="h-10 rounded-full bg-white/35" />
      <ExploreSkeletonBar class="h-10 rounded-full bg-white/20" />
    </div>
  </article>
</template>
