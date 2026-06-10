<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="space-y-1">
    <h2>{{ title }}</h2>
    <p v-if="description" class="max-w-3xl text-body-sm text-grey-300">{{ description }}</p>
  </div>
</template>
