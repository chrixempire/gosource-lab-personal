<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { DISCOUNT_QUICK_STATUS_FILTERS } from '~/lib/discount-constants';
import type { DiscountListFilters } from '~/types/discounts';

const props = defineProps<{
  filters: DiscountListFilters;
  stats: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    deactivated: number;
    used: number;
  };
}>();

const emit = defineEmits<{
  filterStatus: [status: string | null];
}>();

function countFor(key: string) {
  if (key === 'all') {
    return props.stats.total;
  }
  return props.stats[key as keyof typeof props.stats] ?? 0;
}

function isActive(key: string) {
  if (key === 'all') {
    return props.filters.status.length === 0;
  }
  return props.filters.status.includes(key as DiscountListFilters['status'][number]);
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <button
      v-for="item in DISCOUNT_QUICK_STATUS_FILTERS"
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
  </div>
</template>
