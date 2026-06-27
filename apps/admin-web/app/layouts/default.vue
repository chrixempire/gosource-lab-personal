<script setup lang="ts">
import AdminAppShell from '~/components/shell/AdminAppShell.vue';

// Play a sound for any logged-in admin whenever a new order comes in.
useOrderSound();
</script>

<template>
  <AdminAppShell>
    <slot />
  </AdminAppShell>
</template>
