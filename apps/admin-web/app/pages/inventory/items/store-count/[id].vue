<script setup lang="ts">
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

const route = useRoute();
const historyId = String(route.params.id ?? '');

await navigateTo(
  {
    path: ADMIN_PAGE_ROUTES.INVENTORY_STORE_COUNT,
    query: historyId ? { history: historyId } : undefined,
  },
  { replace: true },
);
</script>

<template>
  <div />
</template>
