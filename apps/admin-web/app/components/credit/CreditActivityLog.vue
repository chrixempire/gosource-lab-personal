<script setup lang="ts">
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { formatCreditTimeline } from '~/lib/credit-api';
import type { LegacyCreditTimelineEntry } from '~/types/credit';

const props = defineProps<{
  timeline?: LegacyCreditTimelineEntry[];
}>();

const entries = computed(() => formatCreditTimeline(props.timeline));
</script>

<template>
  <CreditPanelCard title="Activity log">
    <div class="max-h-[300px] space-y-4 overflow-y-auto">
      <template v-if="entries.length">
        <div v-for="(entry, index) in entries" :key="index" class="flex gap-3">
          <div class="flex flex-col items-center gap-1">
            <span class="size-2 rounded-full bg-grey-400" />
            <div class="min-h-6 w-px flex-1 bg-grey-100" />
          </div>
          <div class="pb-2">
            <p class="text-sm font-medium text-grey-900">
              {{ entry.status }}: {{ entry.title }}
            </p>
            <p class="mt-1 text-xs text-grey-500">
              {{ entry.date }}
              <span v-if="entry.user"> · {{ entry.user }}</span>
            </p>
          </div>
        </div>
      </template>
      <p v-else class="text-center text-sm text-grey-500">No activity yet</p>
    </div>
  </CreditPanelCard>
</template>
