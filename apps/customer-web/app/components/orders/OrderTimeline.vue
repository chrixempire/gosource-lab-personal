<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import type { OrderTimelineRecord } from '@gosource/api-client';
import { formatOrderDateTime } from '~/lib/order-details';

defineProps<{
  events: OrderTimelineRecord[];
  loading?: boolean;
}>();

function isCancelledEvent(title: string) {
  return title.trim().toLowerCase() === 'cancelled';
}

function formatTimelineTitle(title: string) {
  return title
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
</script>

<template>
  <section class="rounded-[20px] border border-grey-50 bg-white p-5">
    <h2 class="text-base font-semibold text-grey-900">Order timeline</h2>

    <div v-if="loading" class="mt-5 space-y-4" aria-busy="true" aria-label="Loading timeline">
      <div v-for="index in 3" :key="index" class="flex gap-3">
        <div class="flex flex-col items-center">
          <div class="size-6 shrink-0 animate-pulse rounded-full bg-grey-55" />
          <div
            v-if="index !== 3"
            class="w-0.5 flex-1 min-h-10 bg-grey-55"
          />
        </div>
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-4 w-40 animate-pulse rounded bg-grey-50" />
          <div class="h-3 w-full max-w-md animate-pulse rounded bg-grey-50" />
          <div class="h-3 w-40 animate-pulse rounded bg-grey-50" />
        </div>
      </div>
    </div>

    <p v-else-if="events.length === 0" class="mt-4 text-sm text-grey-300">
      No timeline events yet.
    </p>

    <ol v-else class="mt-5 space-y-0">
      <li
        v-for="(event, index) in events"
        :key="event.id"
        class="flex gap-3"
      >
        <div class="flex flex-col items-center">
          <span
            class="relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-white"
            :class="isCancelledEvent(event.title) ? 'bg-negative-500' : 'bg-primary-500'"
          >
            <Check class="size-3.5" />
          </span>
          <span
            v-if="index !== events.length - 1"
            class="-mt-px w-0.5 flex-1 min-h-10"
            :class="isCancelledEvent(event.title) ? 'bg-negative-500/85' : 'bg-primary-500/85'"
          />
        </div>

        <div class="min-w-0 flex-1 pb-5">
          <p class="text-sm font-semibold text-grey-900">
            {{ formatTimelineTitle(event.title) }}
          </p>
          <p v-if="event.description" class="mt-1 text-sm text-grey-600">
            {{ event.description }}
          </p>
          <p class="mt-2 text-xs text-grey-300">
            {{ formatOrderDateTime(event.updatedAt || event.createdAt) }}
          </p>
        </div>
      </li>
    </ol>
  </section>
</template>
