<script setup lang="ts">
import type { AdminOrderDetailsView } from '~/lib/order-details';

defineProps<{
  view: AdminOrderDetailsView | null;
  loading?: boolean;
}>();

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value);
}
</script>

<template>
  <section
    class="h-full rounded-[16px] border border-primary-100/50 bg-primary-50/70 p-4"
    :aria-busy="loading"
  >
    <template v-if="loading || !view">
      <div class="h-4 w-28 animate-pulse rounded bg-primary-100" />
      <div class="mt-3 space-y-2">
        <div
          v-for="index in 4"
          :key="`summary-skeleton-${index}`"
          class="flex items-center justify-between gap-4"
        >
          <div class="h-4 w-24 animate-pulse rounded bg-primary-100" />
          <div class="h-4 w-24 animate-pulse rounded bg-primary-100" />
        </div>
      </div>
    </template>

    <template v-else>
      <h2 class="text-sm font-semibold text-grey-900">Order summary</h2>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-grey-300">Subtotal</dt>
          <dd class="font-medium text-grey-900">{{ formatNaira(view.subtotal) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-grey-300">Delivery</dt>
          <dd class="font-medium text-grey-900">{{ formatNaira(view.deliveryFee) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-grey-300">Service charge</dt>
          <dd class="font-medium text-grey-900">{{ formatNaira(view.serviceCharge) }}</dd>
        </div>
        <div v-if="view.discount > 0" class="flex justify-between gap-4">
          <dt class="text-grey-300">Discount</dt>
          <dd class="font-medium text-grey-900">-{{ formatNaira(view.discount) }}</dd>
        </div>
        <div
          v-if="view.additionalTotalPrice > 0"
          class="flex justify-between gap-4 border-t border-primary-100 pt-2"
        >
          <dt class="text-grey-300">Order total</dt>
          <dd class="font-medium text-grey-900">{{ formatNaira(view.totalPrice) }}</dd>
        </div>
        <div v-if="view.additionalTotalPrice > 0" class="flex justify-between gap-4">
          <dt class="text-grey-300">Added items</dt>
          <dd class="font-medium text-grey-900">{{ formatNaira(view.additionalTotalPrice) }}</dd>
        </div>
        <div class="flex justify-between gap-4 border-t border-primary-100 pt-2 text-base">
          <dt class="font-semibold text-grey-900">
            {{ view.additionalTotalPrice > 0 ? 'Combined total' : 'Total' }}
          </dt>
          <dd class="font-semibold text-grey-900">
            {{ formatNaira(view.additionalTotalPrice > 0 ? view.combinedTotalPrice : view.totalPrice) }}
          </dd>
        </div>
      </dl>

      <p
        v-if="view.additionalTotalPrice > 0"
        class="mt-3 rounded-lg bg-grey-55 px-3 py-2 text-xs text-grey-700"
      >
        Added items are unpaid. Set the order's payment status to
        <span class="font-semibold">Paid</span> to settle them — they'll then
        merge into the order's items.
      </p>
    </template>
  </section>
</template>
