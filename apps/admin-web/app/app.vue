<script setup lang="ts">
import { Toaster } from '@gosource/ui';
</script>

<template>
  <NuxtLoadingIndicator color="var(--color-primary-500)" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" />
</template>
