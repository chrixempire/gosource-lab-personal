<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div :class="cn('space-y-1', props.class)">
    <slot />
  </div>
</template>
