<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
}>();
</script>

<template>
  <div class="flex items-center justify-between gap-4 py-2.5 text-sm">
    <dt class="shrink-0 text-grey-300">
      {{ label }}
    </dt>
    <dd class="min-w-0 text-right font-medium text-grey-900">
      {{ value }}
    </dd>
  </div>
</template>
