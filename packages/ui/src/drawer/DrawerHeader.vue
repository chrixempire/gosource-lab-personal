<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div :class="cn('flex w-full min-w-0 items-start justify-between gap-4 border-b border-grey-50 p-4 text-left sm:px-4 sm:pt-2.5 sm:pb-3', props.class)">
    <slot />
  </div>
</template>
