<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div
    class="rounded-2xl border border-dashed border-grey-50 bg-white px-6 py-12 text-center"
  >
    <p class="text-body-lg font-medium text-grey-900">{{ title }}</p>
    <p v-if="description" class="mt-2 text-body-sm text-grey-300">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4 flex justify-center">
      <slot />
    </div>
  </div>
</template>
