<script setup lang="ts">
import AdminMobileCardItem from '~/components/shared/AdminMobileCardItem.vue';
import AdminMobileCardList from '~/components/shared/AdminMobileCardList.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminTableRowIndex from '~/components/shared/AdminTableRowIndex.vue';
import {
  getBestSellerProductName,
  getBestSellerProductPrice,
  getBestSellerRowId,
} from '~/lib/dashboard-api';
import { formatDashboardCurrency, formatDashboardNumber } from '~/lib/dashboard-date';
import type { DashboardBestSeller, DashboardTableMeta } from '~/types/dashboard';

defineProps<{
  rows: DashboardBestSeller[];
  meta: DashboardTableMeta;
}>();
</script>

<template>
  <AdminMobileCardList>
    <AdminMobileCardItem
      v-for="(row, index) in rows"
      :key="getBestSellerRowId(row, index)"
    >
      <div class="flex items-start gap-3">
        <AdminTableRowIndex :value="index + 1" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-grey-900">{{ getBestSellerProductName(row) }}</p>
          <p class="mt-0.5 text-sm text-grey-300">
            {{ formatDashboardCurrency(getBestSellerProductPrice(row)) }}
          </p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <AdminMobileCardStat label="Orders">
          {{ formatDashboardNumber(row.totalOrders) }}
        </AdminMobileCardStat>
        <AdminMobileCardStat label="Qty sold">
          {{ formatDashboardNumber(row.totalQuantitySold) }}
        </AdminMobileCardStat>
      </div>
    </AdminMobileCardItem>
  </AdminMobileCardList>
</template>
