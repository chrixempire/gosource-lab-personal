<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../lib/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="
      cn(
        'overflow-hidden rounded-b-xl border-t border-grey-50 bg-[#FAFBFC]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
