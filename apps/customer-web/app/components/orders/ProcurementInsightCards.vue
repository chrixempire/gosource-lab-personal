<script setup lang="ts">
import { formatNaira } from '~/composables/useMarketplaceCart';
import type { ProcurementInsightTableRow } from '~/lib/procurement-insight-table';

defineProps<{
  rows: ProcurementInsightTableRow[];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <article
      v-for="row in rows"
      :key="row.id"
      class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] sm:p-5"
    >
      <div class="min-w-0 space-y-1">
        <h2 class="truncate text-base font-semibold leading-snug text-grey-900">
          {{ row.name }}
        </h2>
        <p
          class="line-clamp-2 text-sm text-grey-300"
          :title="row.description !== '—' ? row.description : undefined"
        >
          {{ row.description }}
        </p>
      </div>

      <div class="mt-4 space-y-2">
        <div class="flex items-center justify-between gap-2 text-xs text-grey-300">
          <span>Share of spend</span>
          <span class="tabular-nums font-medium text-grey-900">{{ row.percent }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-grey-55">
          <div
            class="h-full rounded-full transition-[width] duration-300"
            :class="row.barClass"
            :style="{ width: `${Math.max(row.percent, 4)}%` }"
          />
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Quantity
          </p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-grey-900">
            {{ row.quantity }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Spend
          </p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-grey-900">
            {{ formatNaira(row.totalSpent) }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Share
          </p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-grey-900">
            {{ row.percent }}%
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Purchased
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ row.lastPurchaseLabel }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
