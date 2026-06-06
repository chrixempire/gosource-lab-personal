<script setup lang="ts">
import { StatCard } from '@gosource/ui';
import { formatDashboardNumber } from '~/lib/dashboard-date';
import { CREDIT_APPLICATION_STAT_CARDS } from '~/lib/credit-constants';

const props = defineProps<{
  stats: { all: number; pending: number; approved: number; rejected: number };
  activeStatus: string | null;
}>();

const emit = defineEmits<{
  filterStatus: [status: string | null];
}>();

function countFor(key: string) {
  if (key === 'all') return props.stats.all;
  return props.stats[key as keyof typeof props.stats] ?? 0;
}

function isActive(key: string) {
  if (key === 'all') return !props.activeStatus;
  return props.activeStatus === key;
}
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
    <button
      v-for="item in CREDIT_APPLICATION_STAT_CARDS"
      :key="item.key"
      type="button"
      class="w-full min-w-0 text-left"
      @click="emit('filterStatus', item.key === 'all' ? null : item.key)"
    >
      <StatCard
        :label="item.label"
        :value="formatDashboardNumber(countFor(item.key))"
        :active="isActive(item.key)"
        class="h-full w-full cursor-pointer capitalize"
      />
    </button>
  </div>
</template>
