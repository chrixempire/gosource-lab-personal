<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <p :class="cn('text-[13px] font-medium', props.class)">
    <slot />
  </p>
</template>
