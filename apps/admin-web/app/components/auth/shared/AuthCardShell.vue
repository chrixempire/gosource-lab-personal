<script setup lang="ts">
defineProps<{
  badge: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="w-full max-w-[420px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_24px_60px_-28px_rgba(16,25,40,0.24)] sm:p-5">
    <div class="space-y-2 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-grey-300">
        {{ badge }}
      </p>
      <h1 class="text-auth-title">
        {{ title }}
      </h1>
      <p v-if="description" class="mx-auto max-w-76 text-body-sm text-grey-300">
        {{ description }}
      </p>
    </div>

    <div class="mt-6">
      <slot />
    </div>

    <div v-if="$slots.footer" class="mt-4">
      <slot name="footer" />
    </div>
  </div>
</template>
