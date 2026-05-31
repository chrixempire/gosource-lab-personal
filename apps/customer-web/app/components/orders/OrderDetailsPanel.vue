<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import OrderDetailFieldRow from '~/components/orders/OrderDetailFieldRow.vue';
import RequestProductLinesEditor from '~/components/requests/RequestProductLinesEditor.vue';
import type { OrderDetailsView } from '~/lib/order-details';

defineProps<{
  view: OrderDetailsView | null;
  loading?: boolean;
  formatCurrency: (value: number) => string;
}>();
</script>

<template>
  
  <div v-if="loading || !view" class="space-y-5" aria-busy="true" aria-label="Loading order details">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-3">
        <div class="h-5 w-32 animate-pulse rounded bg-grey-50" />
        <div class="mt-3 h-px w-full bg-grey-50" />
        <div class="mt-4 space-y-2">
          <div v-for="index in 5" :key="index" class="h-10 animate-pulse rounded bg-grey-55" />
        </div>
      </div>
      <div class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-2">
        <div class="h-5 w-36 animate-pulse rounded bg-grey-50" />
        <div class="mt-3 h-px w-full bg-grey-50" />
        <div class="mt-4 space-y-2">
          <div v-for="index in 4" :key="index" class="h-10 animate-pulse rounded bg-grey-55" />
        </div>
      </div>
    </div>
    <div class="rounded-[18px] border border-grey-50 bg-background-on-canvas p-4">
      <RequestProductLinesEditor :products="[]" loading :format-currency="formatCurrency" />
    </div>
  </div>

  
  <div v-else class="space-y-5">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <section class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-3">
        <h2 class="text-base font-semibold text-grey-900">Order details</h2>
        <div class="mt-3 border-b border-grey-50" />
        <dl class="mt-1">
          <OrderDetailFieldRow label="Approved by" :value="view.approvedByName" />
          <OrderDetailFieldRow label="Order date" :value="view.createdLabel" />
          <OrderDetailFieldRow label="Phone number" :value="view.phoneNumber" />
          <div class="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt class="shrink-0 text-grey-300">Payment method & status</dt>
            <dd class="flex min-w-0 flex-wrap items-center justify-end gap-1">
              <span class="font-medium text-grey-900">{{ view.paymentMethod ?? '—' }}</span>
              <StatusTag :variant="view.paymentStatusVariant" size="medium" class="rounded-full px-3 py-1 text-xs font-semibold normal-case">{{ view.paymentStatusLabel }}</StatusTag>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt class="shrink-0 text-grey-300">Delivery address</dt>
            <dd class="min-w-0 text-right font-medium leading-6 text-grey-900">
              <p>{{ view.addressLine }}</p>
              <p v-if="view.addressDirections" class="mt-1 text-grey-300">{{ view.addressDirections }}</p>
            </dd>
          </div>
        </dl>
      </section>
      <section class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-2">
        <h2 class="text-base font-semibold text-grey-900">Customer details</h2>
        <div class="mt-3 border-b border-grey-50" />
        <dl class="mt-1">
          <OrderDetailFieldRow label="Full name" :value="view.customerFullName" />
          <OrderDetailFieldRow label="Branch" :value="view.customerBranch" />
          <OrderDetailFieldRow label="Position" :value="view.customerPosition" />
          <OrderDetailFieldRow label="Phone number" :value="view.customerPhone" />
          <OrderDetailFieldRow label="Email" :value="view.customerEmail" />
        </dl>
      </section>
    </div>
    <section class="rounded-[18px] border border-grey-50 bg-background-on-canvas p-4">
      <h2 class="mb-3 text-sm font-semibold text-grey-900">Line items</h2>
      <RequestProductLinesEditor :products="view.products" :format-currency="formatCurrency" />
    </section>
    <section class="customer-pricing-summary rounded-[16px] p-4">
      <h2 class="text-sm font-semibold text-grey-900">Order summary</h2>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex justify-between gap-4"><dt class="text-grey-900">Subtotal</dt><dd class="font-medium text-grey-900">{{ formatCurrency(view.subtotal) }}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-grey-900">Delivery</dt><dd class="font-medium text-grey-900">{{ formatCurrency(view.deliveryFee) }}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-grey-900">Service charge</dt><dd class="font-medium text-grey-900">{{ formatCurrency(view.serviceCharge) }}</dd></div>
        <div v-if="view.discount > 0" class="flex justify-between gap-4"><dt class="text-grey-900">Discount</dt><dd class="font-medium text-grey-900">-{{ formatCurrency(view.discount) }}</dd></div>
        <div class="flex justify-between gap-4 border-t border-grey-50 pt-2 text-base dark:border-grey-50/80"><dt class="font-semibold text-grey-900">Total</dt><dd class="font-semibold text-grey-900">{{ formatCurrency(view.totalPrice) }}</dd></div>
      </dl>
    </section>
  </div>

</template>
