<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../lib/cn';

interface Props {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('max-h-[560px] overflow-y-auto pt-1.5', props.class)">
    <slot />
  </div>
</template>
