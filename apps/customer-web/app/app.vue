<script setup lang="ts">
import { Toaster } from '@gosource/ui';
</script>

<template>
  <NuxtLoadingIndicator color="#09420c" :height="3" :duration="2000" :throttle="80" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" />
</template>
