<script setup lang="ts">
// Marketing chrome shared across pages.
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <AnnouncementBar />
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
