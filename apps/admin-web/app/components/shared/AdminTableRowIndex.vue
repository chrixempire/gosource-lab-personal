<script setup lang="ts">
/** Matches @gosource/ui TableHeadRow: bg-primary-50 + text-grey-700 */
defineProps<{
  value: number | string;
}>();
</script>

<template>
  <span
    class="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-grey-700"
    aria-hidden="true"
  >
    {{ value }}
  </span>
</template>
