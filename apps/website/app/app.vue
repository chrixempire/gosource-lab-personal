<script setup lang="ts">
// Root shell. Pages render through the default layout.
</script>

<template>
  <NuxtLoadingIndicator color="#19B820" :height="3" :duration="2000" :throttle="80" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
