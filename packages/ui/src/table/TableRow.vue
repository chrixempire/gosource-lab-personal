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
    :class="
      cn(
        'grid min-h-[72px] items-center gap-4 border-b border-grey-50 px-4 py-3',
        props.class,
      )
    "
    :style="props.style"
  >
    <slot />
  </div>
</template>
