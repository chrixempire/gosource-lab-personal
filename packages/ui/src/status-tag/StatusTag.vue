<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../lib/cn';
import { type StatusTagVariants, statusTagVariants } from '.';

const props = defineProps<{
  variant?: StatusTagVariants['variant'];
  size?: StatusTagVariants['size'];
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div :class="cn(statusTagVariants({ variant: props.variant, size: props.size }), props.class)">
    <slot />
  </div>
</template>
