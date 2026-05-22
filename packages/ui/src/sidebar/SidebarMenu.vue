<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div :class="cn('flex w-full min-w-0 flex-col space-y-1', props.class)">
    <slot />
  </div>
</template>
