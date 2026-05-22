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
        'grid min-h-10 items-center gap-4 rounded-[11px] bg-primary-50 px-4 py-2.5 text-sm font-semibold text-grey-700',
        props.class,
      )
    "
    :style="props.style"
  >
    <slot />
  </div>
</template>
