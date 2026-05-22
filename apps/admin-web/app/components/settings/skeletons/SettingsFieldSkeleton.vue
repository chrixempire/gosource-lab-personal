<script setup lang="ts">
withDefaults(
  defineProps<{
    showLabel?: boolean;
  }>(),
  { showLabel: true },
);
</script>

<template>
  <div class="space-y-2">
    <div v-if="showLabel" class="h-3 w-24 animate-pulse rounded bg-grey-55" />
    <div class="h-10 w-full animate-pulse rounded-[10px] bg-grey-55" />
  </div>
</template>
