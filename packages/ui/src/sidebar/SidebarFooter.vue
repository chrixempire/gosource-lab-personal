<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <div :class="cn('w-full min-w-0 shrink-0', props.class)">
    <slot />
  </div>
</template>
