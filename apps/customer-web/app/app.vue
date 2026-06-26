<script setup lang="ts">
import { Toaster } from '@gosource/ui';
</script>

<template>
  <NuxtLoadingIndicator color="#09420c" :height="3" :duration="1800" :throttle="0" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" />
</template>
