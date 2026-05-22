<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div :class="cn('flex items-center gap-2 border-t border-grey-50 p-4 sm:px-4 sm:pt-2.5 sm:pb-3', '[&>*]:flex-1', props.class)">
    <slot />
  </div>
</template>
