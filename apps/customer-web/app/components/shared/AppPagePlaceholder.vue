<script setup lang="ts">
defineProps<{
  description?: string;
}>();
</script>

<template>
  <section v-if="description" class="w-full">
    <p class="max-w-3xl text-base leading-7 text-grey-text">
      {{ description }}
    </p>
  </section>
</template>
