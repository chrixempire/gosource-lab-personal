<script setup lang="ts">
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useDashboardDateFilter } from '~/composables/useDashboardDateFilter';
import DashboardDateFilter from '~/components/dashboard/DashboardDateFilter.vue';
import DashboardStatCards from '~/components/dashboard/DashboardStatCards.vue';
import DashboardUnresolvedCostItems from '~/components/dashboard/DashboardUnresolvedCostItems.vue';
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
    <DashboardDateFilter v-model="filter" />

    <DashboardStatCards :filter="filter" />

    <DashboardUnresolvedCostItems :filter="filter" />

    <DashboardChartsRow :filter="filter" />

    <DashboardTablesRow :filter="filter" />
  </div>
</template>
