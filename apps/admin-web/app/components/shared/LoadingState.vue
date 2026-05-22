<script setup lang="ts">
import { cn } from '@gosource/ui';

const props = withDefaults(
  defineProps<{
    label?: string;
    class?: string;
  }>(),
  {
    label: 'Loading…',
    class: undefined,
  },
);
</script>

<template>
  <div
    :class="cn('flex min-h-[200px] items-center justify-center', props.class)"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-center gap-3 text-sm text-grey-300">
      <span
        class="h-5 w-5 animate-spin rounded-full border-2 border-grey-50 border-t-primary-500"
        aria-hidden="true"
      />
      {{ label }}
    </div>
  </div>
</template>
