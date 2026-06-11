<script setup lang="ts">
import CreditSkeletonBar from '~/components/credit/CreditSkeletonBar.vue';
</script>

<template>
  <div
    class="customer-surface-card min-w-0 flex-1 basis-[min(100%,20rem)] rounded-lg px-4 py-3"
    aria-hidden="true"
  >
    <div class="flex flex-col gap-2">
      <CreditSkeletonBar class="h-6 w-36 rounded-full" />
      <CreditSkeletonBar class="h-4 w-44" />
      <CreditSkeletonBar class="h-4 w-full max-w-xl" />
      <CreditSkeletonBar class="h-4 w-[min(100%,20rem)]" />
    </div>
  </div>
</template>
