<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <section :class="cn('space-y-2', props.class)">
    <slot />
  </section>
</template>
