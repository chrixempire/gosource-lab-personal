<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section class="rounded-xl border border-grey-50 bg-white">
    <header class="border-b border-grey-50 px-4 py-3">
      <h3 class="text-base font-semibold text-grey-900">{{ title }}</h3>
    </header>
    <div class="px-4 py-4">
      <slot />
    </div>
  </section>
</template>
