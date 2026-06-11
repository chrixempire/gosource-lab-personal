<script setup lang="ts">
import { cn } from '@gosource/ui';

const props = withDefaults(
  defineProps<{
    class?: string;
  }>(),
  {
    class: undefined,
  },
);
</script>

<template>
  <div
    :class="cn('min-h-0 min-w-0 animate-pulse rounded bg-grey-50', props.class)"
    aria-hidden="true"
  />
</template>
