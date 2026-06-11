<script setup lang="ts">
import CreditSkeletonBar from '~/components/credit/CreditSkeletonBar.vue';
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3" aria-hidden="true">
    <div
      v-for="index in 3"
      :key="`credit-stat-${index}`"
      class="customer-surface-card rounded-lg p-5"
    >
      <CreditSkeletonBar class="mb-3 h-4 w-32" />
      <CreditSkeletonBar class="h-8 w-36 max-w-full" />
      <CreditSkeletonBar v-if="index === 1" class="mt-2 h-3 w-52 max-w-full" />
    </div>
  </div>
</template>
