<script setup lang="ts">
definePageMeta({
  layout: false,
});

const route = useRoute();

await navigateTo(
  {
    path: '/auth/sign-in',
    query: route.query,
  },
  { replace: true },
);
</script>

<template>
  <div />
</template>
