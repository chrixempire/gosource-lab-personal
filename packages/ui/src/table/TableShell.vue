<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../lib/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <section
    :class="
      cn(
        'overflow-hidden rounded-xl border border-grey-50 bg-background-on-canvas shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]',
        props.class,
      )
    "
  >
    <slot />
  </section>
</template>
