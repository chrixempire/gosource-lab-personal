<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div :class="cn('min-h-0 w-full min-w-0 flex-1 overflow-y-auto', props.class)">
    <slot />
  </div>
</template>
