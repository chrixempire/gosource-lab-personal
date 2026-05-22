<script setup lang="ts">
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useDashboardDateFilter } from '~/composables/useDashboardDateFilter';
import PageHeader from '~/components/shared/PageHeader.vue';
import DashboardDateFilter from '~/components/dashboard/DashboardDateFilter.vue';
import DashboardStatCards from '~/components/dashboard/DashboardStatCards.vue';
import DashboardChartsRow from '~/components/dashboard/DashboardChartsRow.vue';
import DashboardTablesRow from '~/components/dashboard/DashboardTablesRow.vue';

const { updateHeader } = useAdminHeader();
const { filter } = useDashboardDateFilter();

updateHeader({
  title: 'Dashboard',
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <PageHeader
      title="Dashboard"
      description="Overview of orders, customers, and product performance."
    />

    <DashboardDateFilter v-model="filter" />

    <DashboardStatCards :filter="filter" />

    <DashboardChartsRow :filter="filter" />

    <DashboardTablesRow :filter="filter" />
  </div>
</template>
