<script setup lang="ts">
import { cn } from '../lib/cn';

const props = defineProps<{
  label: string;
  value: string;
  hint?: string;
  /** Shown in brackets beside the value, 4px gap (e.g. `0 (Overall account status)`). */
  inlineHint?: string;
  active?: boolean;
  class?: string;
}>();
</script>

<template>
  <article
    :class="
      cn(
        'flex w-full min-w-0 flex-col gap-0 rounded-xl border border-grey-50 bg-white p-5 text-left shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] transition-colors',
        props.active && 'border-primary-200 bg-primary-50',
        props.class,
      )
    "
  >
    <p class="text-sm font-medium text-grey-300">
      <slot name="label">{{ label }}</slot>
    </p>
    <div class="mt-3.5 flex items-baseline gap-1">
      <span class="text-2xl font-semibold text-grey-900">{{ value }}</span>
      <span v-if="inlineHint" class="text-xs font-normal text-grey-300">
        ({{ inlineHint }})
      </span>
    </div>
    <p v-if="hint && !inlineHint" class="mt-1 text-xs text-grey-300">{{ hint }}</p>
    <slot />
  </article>
</template>
