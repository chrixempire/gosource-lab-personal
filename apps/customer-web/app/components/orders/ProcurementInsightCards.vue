<script setup lang="ts">
import { formatNaira } from '~/composables/useMarketplaceCart';
import type { ProcurementInsightTableRow } from '~/lib/procurement-insight-table';

withDefaults(
  defineProps<{
    rows: ProcurementInsightTableRow[];
    showBranchColumn?: boolean;
  }>(),
  {
    showBranchColumn: false,
  },
);
</script>

<template>
  <div class="space-y-3">
    <article
      v-for="row in rows"
      :key="row.id"
      class="rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_12px_32px_-24px_rgba(16,24,40,0.14)]"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-semibold leading-snug text-grey-900">
            {{ row.name }}
          </h3>
          <p
            v-if="row.description"
            class="mt-0.5 line-clamp-2 text-sm text-grey-300"
          >
            {{ row.description }}
          </p>
        </div>
        <p class="shrink-0 text-sm font-semibold tabular-nums text-grey-900">
          {{ formatNaira(row.totalSpent) }}
        </p>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2.5">
        <div
          v-if="showBranchColumn"
          class="rounded-[12px] bg-grey-55 px-3 py-2.5"
        >
          <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-grey-300">
            Branch
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ row.branchName ?? '—' }}
          </p>
        </div>
        <div class="rounded-[12px] bg-grey-55 px-3 py-2.5">
          <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-grey-300">
            Qty
          </p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-grey-900">
            {{ row.quantity }}
          </p>
        </div>
        <div class="rounded-[12px] bg-grey-55 px-3 py-2.5">
          <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-grey-300">
            Breakdown
          </p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-grey-900">
            {{ row.percent }}%
          </p>
        </div>
        <div class="rounded-[12px] bg-grey-55 px-3 py-2.5">
          <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-grey-300">
            Purchased
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ row.lastPurchaseLabel }}
          </p>
        </div>
      </div>

      <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-grey-55">
        <div
          class="h-full rounded-full transition-[width] duration-300"
          :class="row.barClass"
          :style="{ width: `${Math.max(row.percent, 4)}%` }"
        />
      </div>
    </article>
  </div>
</template>
