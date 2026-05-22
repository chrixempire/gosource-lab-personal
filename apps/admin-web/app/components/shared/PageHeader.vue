<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="space-y-1">
    <h2 class="text-2xl font-semibold tracking-tight text-grey-900">{{ title }}</h2>
    <p v-if="description" class="max-w-3xl text-sm text-grey-300">{{ description }}</p>
  </div>
</template>
