<script setup lang="ts">
import type { HTMLAttributes, CSSProperties } from 'vue';
import { cn } from '../lib/cn';

interface Props {
  class?: HTMLAttributes['class'];
  style?: CSSProperties;
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="cn('px-1 pt-1', props.class)"
    :style="props.style"
  >
    <slot />
  </div>
</template>
