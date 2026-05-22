<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="flex h-full min-h-[56px] flex-col rounded-xl border border-grey-75/80 bg-grey-55 px-3 py-2.5">
    <p class="text-[10px] font-medium uppercase tracking-wide text-grey-300">
      {{ label }}
    </p>
    <p class="mt-1 text-sm font-semibold text-grey-900">
      <slot />
    </p>
  </div>
</template>
