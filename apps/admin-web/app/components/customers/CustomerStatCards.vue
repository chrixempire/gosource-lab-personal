<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { CUSTOMER_QUICK_STAT_FILTERS } from '~/lib/customer-constants';

const props = defineProps<{
  activeAccountType: string | null;
  stats: { total: number; business: number; individual: number };
}>();

const emit = defineEmits<{
  filterAccountType: [type: string | null];
}>();

function countFor(key: string) {
  if (key === 'all') return props.stats.total;
  if (key === 'business') return props.stats.business;
  return props.stats.individual;
}

function isActive(key: string) {
  if (key === 'all') return !props.activeAccountType;
  return props.activeAccountType === key;
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <button
      v-for="item in CUSTOMER_QUICK_STAT_FILTERS"
      :key="item.key"
      type="button"
      class="w-full min-w-0 text-left"
      @click="emit('filterAccountType', item.key === 'all' ? null : item.key)"
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
