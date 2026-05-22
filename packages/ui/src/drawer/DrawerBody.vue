<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div :class="cn('min-h-0 flex-1 overflow-y-auto p-4 sm:px-4 sm:pt-2.5 sm:pb-3', props.class)">
    <slot />
  </div>
</template>
