<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { PROMOTION_QUICK_STATUS_FILTERS } from '~/lib/promotion-constants';
import type { PromotionListFilters, PromotionListStats } from '~/types/promotions';

const props = defineProps<{
  filters: PromotionListFilters;
  stats: PromotionListStats;
}>();

const emit = defineEmits<{
  filterStatus: [status: string | null];
}>();

function countFor(key: string) {
  if (key === 'all') {
    return props.stats.total;
  }
  return props.stats[key as keyof PromotionListStats] ?? 0;
}

function isActive(key: string) {
  if (key === 'all') {
    return props.filters.status.length === 0;
  }
  return props.filters.status.includes(key as PromotionListFilters['status'][number]);
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <button
      v-for="item in PROMOTION_QUICK_STATUS_FILTERS"
      :key="item.key"
      type="button"
      class="w-full min-w-0 text-left"
      @click="emit('filterStatus', item.key === 'all' ? null : item.key)"
    >
      <StatCard
        :label="item.label"
        :value="formatDashboardNumber(countFor(item.key))"
        :active="isActive(item.key)"
        class="h-full w-full cursor-pointer"
      />
    </button>
    <StatCard
      label="Used promotions"
      :value="formatDashboardNumber(stats.usage)"
      class="h-full w-full"
    />
  </div>
</template>
