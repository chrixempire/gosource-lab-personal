<script setup lang="ts">
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  toDashboardQueryParams,
} from '~/lib/dashboard-date';
import type { DashboardDateFilterValue, DashboardSummaryResponse } from '~/types/dashboard';

const props = defineProps<{
  filter: DashboardDateFilterValue;
}>();

const query = computed(() => toDashboardQueryParams(props.filter));

// Shares the same request/key as DashboardStatCards, so this adds no extra fetch.
const { data } = await useAdminAuthenticatedFetch<DashboardSummaryResponse>(
  '/api/dashboard/summary',
  {
    query,
    watch: [query],
    key: 'admin-dashboard-summary',
    staleAfterMs: 60_000,
  },
);

const canSeeFinancials = computed(() => data.value?.permissions?.financials ?? false);
const items = computed(() => data.value?.unresolvedCostItems ?? []);
const count = computed(() => items.value.length);

const open = ref(false);

function totalSellingPrice(item: { sellingPrice: number | null; quantity: number | null }) {
  if (item.sellingPrice == null || item.sellingPrice <= 0 || item.quantity == null) {
    return null;
  }
  return item.sellingPrice * item.quantity;
}

function reasonLabel(reason: string) {
  return reason === 'suspected_price' ? 'Suspected price' : 'No market price';
}
</script>

<template>
  <section
    v-if="canSeeFinancials && count > 0"
    class="w-full min-w-0 overflow-hidden rounded-xl border border-[#F6D365] bg-[#FFF8E6]"
  >
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#FFF1C2]/50"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex min-w-0 items-center gap-2.5">
        <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1C2] text-[#F59E0B]">
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-[#92400E]">
            {{ count }} item{{ count === 1 ? '' : 's' }} need pricing attention
          </span>
          <span class="block truncate text-xs text-[#B45309]">
            No-market-price items are left out of profit; suspected prices are still counted — review both.
          </span>
        </span>
      </span>
      <svg
        class="size-5 shrink-0 text-[#B45309] transition-transform duration-300 ease-out"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 8l4 4 4-4"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- grid-rows 0fr -> 1fr gives a smooth height transition without JS measurement -->
    <div
      class="grid transition-[grid-template-rows] duration-300 ease-out"
      :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <div class="border-t border-[#F6D365]/60 bg-white/80">
          <div class="w-full overflow-x-auto">
            <table class="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr class="border-b border-[#F6D365]/50 text-left text-xs font-medium uppercase tracking-wide text-[#B45309]/70">
                  <th class="px-4 py-2.5 font-medium">S/N</th>
                  <th class="px-4 py-2.5 font-medium">Order ref</th>
                  <th class="px-4 py-2.5 font-medium">Product</th>
                  <th class="px-4 py-2.5 font-medium">Unit</th>
                  <th class="px-4 py-2.5 font-medium">Quantity</th>
                  <th class="px-4 py-2.5 font-medium">Market price</th>
                  <th class="px-4 py-2.5 font-medium">Total selling price</th>
                  <th class="px-4 py-2.5 font-medium">Issue</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in items"
                  :key="`${item.orderRef}-${index}`"
                  class="border-b border-[#F6D365]/25 last:border-b-0"
                >
                  <td class="px-4 py-2.5 text-grey-400">{{ index + 1 }}</td>
                  <td class="px-4 py-2.5 font-mono text-xs text-grey-700">{{ item.orderRef || '—' }}</td>
                  <td class="px-4 py-2.5 font-medium text-grey-800">{{ item.productName }}</td>
                  <td class="px-4 py-2.5 text-grey-600">{{ item.unit || '—' }}</td>
                  <td class="px-4 py-2.5 text-grey-600">
                    {{ item.quantity == null ? '—' : formatDashboardNumber(item.quantity) }}
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      v-if="item.marketPrice != null && item.marketPrice > 0"
                      class="text-grey-800"
                    >{{ formatDashboardCurrency(item.marketPrice) }}</span>
                    <span v-else class="font-medium text-rose-500">Not set</span>
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      v-if="totalSellingPrice(item) != null"
                      class="text-grey-800"
                    >{{ formatDashboardCurrency(totalSellingPrice(item)!) }}</span>
                    <span v-else class="text-grey-400">—</span>
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="item.reason === 'suspected_price'
                        ? 'bg-[#FFF1C2] text-[#B45309]'
                        : 'bg-rose-50 text-rose-600'"
                    >{{ reasonLabel(item.reason) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
