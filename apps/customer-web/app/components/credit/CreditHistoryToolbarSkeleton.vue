<script setup lang="ts">
import CreditSkeletonBar from '~/components/credit/CreditSkeletonBar.vue';
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4" aria-hidden="true">
    <div class="flex items-center gap-1 rounded-full border border-grey-50 bg-background-on-canvas p-1">
      <CreditSkeletonBar class="h-9 w-[7.5rem] rounded-full" />
      <CreditSkeletonBar class="h-9 w-[8.5rem] rounded-full" />
    </div>
    <CreditSkeletonBar class="h-10 w-full max-w-xs rounded-[10px]" />
  </div>
</template>
