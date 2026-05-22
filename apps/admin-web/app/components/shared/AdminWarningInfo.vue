<script setup lang="ts">
import { Info } from 'lucide-vue-next';
import { cn } from '@gosource/ui';

/** Matches `StatusTag` `warning` variant used for pending states in admin-web. */
const WARNING_INFO_CLASS =
  'border-[#f7b23b] bg-warning-75 text-warning-700';

defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'flex w-full items-start gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium normal-case',
        WARNING_INFO_CLASS,
        $props.class,
      )
    "
    role="status"
  >
    <Info class="mt-0.5 size-5 shrink-0 text-warning-700" aria-hidden="true" />
    <p class="min-w-0 flex-1 leading-5">
      <slot />
    </p>
  </div>
</template>
