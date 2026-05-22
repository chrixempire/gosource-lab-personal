<script setup lang="ts">
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import type { AdminOrderDetailsView } from '~/lib/order-details';

const props = defineProps<{
  view?: AdminOrderDetailsView | null;
  loading?: boolean;
}>();

const summaryRows = computed(() => [
  { label: 'Subtotal', value: formatDashboardCurrency(props.view?.subtotal ?? 0) },
  { label: 'Service charge', value: formatDashboardCurrency(props.view?.serviceCharge ?? 0) },
  { label: 'Delivery fee', value: formatDashboardCurrency(props.view?.deliveryFee ?? 0) },
  {
    label: 'Total',
    value: formatDashboardCurrency(props.view?.totalPrice ?? 0),
    emphasis: true,
  },
]);
</script>

<template>
  <section
    class="h-fit w-full self-start overflow-hidden rounded-[11px] border border-grey-50 bg-primary-50"
  >
    <div class="border-b border-primary-100/40 px-4 py-2.5">
      <h2 class="text-sm font-semibold text-grey-700">Summary</h2>
    </div>
    <dl v-if="loading || !view" class="space-y-3 px-4 py-4">
      <div
        v-for="index in 4"
        :key="`summary-skeleton-${index}`"
        class="flex items-center justify-between gap-4 text-sm"
      >
        <div class="h-4 w-24 animate-pulse rounded bg-primary-100/70" />
        <div class="h-4 w-20 animate-pulse rounded bg-primary-100/70" />
      </div>
    </dl>
    <dl v-else class="space-y-3 px-4 py-4">
      <div
        v-for="row in summaryRows"
        :key="row.label"
        class="flex items-center justify-between gap-4 text-sm"
      >
        <dt :class="row.emphasis ? 'font-semibold text-grey-700' : 'text-grey-600'">{{ row.label }}</dt>
        <dd :class="row.emphasis ? 'text-base font-semibold text-grey-900' : 'font-medium text-grey-800'">
          {{ row.value }}
        </dd>
      </div>
    </dl>
  </section>
</template>
