<script setup lang="ts">
import AdminMobileCardItem from '~/components/shared/AdminMobileCardItem.vue';
import AdminMobileCardList from '~/components/shared/AdminMobileCardList.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminTableRowIndex from '~/components/shared/AdminTableRowIndex.vue';
import { formatDashboardCurrency, formatDashboardNumber } from '~/lib/dashboard-date';
import type { DashboardRankedCustomer, DashboardTableMeta } from '~/types/dashboard';

defineProps<{
  rows: DashboardRankedCustomer[];
  meta: DashboardTableMeta;
}>();
</script>

<template>
  <AdminMobileCardList>
    <AdminMobileCardItem
      v-for="(row, index) in rows"
      :key="String(row.customerId)"
    >
      <div class="flex items-start gap-3">
        <AdminTableRowIndex :value="index + 1" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-grey-900">{{ row.businessName ?? '—' }}</p>
          <p v-if="row.email" class="mt-0.5 truncate text-sm text-grey-300">{{ row.email }}</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <AdminMobileCardStat label="Orders">
          {{ formatDashboardNumber(row.totalOrders) }}
        </AdminMobileCardStat>
        <AdminMobileCardStat label="Total spent">
          {{ formatDashboardCurrency(row.totalSpent) }}
        </AdminMobileCardStat>
      </div>
    </AdminMobileCardItem>
  </AdminMobileCardList>
</template>
