<script setup lang="ts">
import DashboardProductsTable from '~/components/dashboard/DashboardProductsTable.vue';
import DashboardCustomersTable from '~/components/dashboard/DashboardCustomersTable.vue';
import type { DashboardDateFilterValue } from '~/types/dashboard';

defineProps<{
  filter: DashboardDateFilterValue;
}>();
</script>

<template>
  <section class="flex flex-col gap-4">
    <DashboardProductsTable :filter="filter" />
    <DashboardCustomersTable :filter="filter" />
  </section>
</template>
