<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import OrderCardSkeleton from '~/components/orders/OrderCardSkeleton.vue';

const props = withDefaults(
  defineProps<{
    rowCount?: number;
  }>(),
  {
    rowCount: 2,
  },
);

const breakpoints = useBreakpoints(breakpointsTailwind);

const columnCount = computed(() => {
  if (breakpoints.greaterOrEqual('2xl').value) {
    return 4;
  }
  if (breakpoints.greaterOrEqual('xl').value) {
    return 3;
  }
  if (breakpoints.greaterOrEqual('sm').value) {
    return 2;
  }
  return 1;
});

const placeholderCount = computed(() => columnCount.value * props.rowCount);
</script>

<template>
  <div class="grid grid-cols-1 gap-4 p-4 pt-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
    <OrderCardSkeleton
      v-for="index in placeholderCount"
      :key="index"
    />
  </div>
</template>
