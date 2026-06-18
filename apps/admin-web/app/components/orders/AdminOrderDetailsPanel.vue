<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import AdminOrderLineItemsSection from '~/components/orders/AdminOrderLineItemsSection.vue';
import OrderPaymentStatusSelect from '~/components/orders/OrderPaymentStatusSelect.vue';
import type { AdminOrderDetailsView } from '~/lib/order-details';
import type { OrderPaymentStatus } from '~/types/orders';

const props = defineProps<{
  view: AdminOrderDetailsView | null;
  loading?: boolean;
  orderId?: string;
  paymentStatusUpdating?: boolean;
}>();

const emit = defineEmits<{
  updatePaymentStatus: [status: OrderPaymentStatus];
  lineItemsUpdated: [];
}>();

const paymentReadOnly = computed(() => props.view?.status === 'cancelled');
</script>

<template>
  <div v-if="loading || !view" class="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true">
    <section class="rounded-[20px] border border-grey-50 bg-white p-5">
      <div class="h-5 w-32 animate-pulse rounded bg-grey-55" />
      <div class="mt-3 border-b border-grey-50" />
      <div class="mt-3 space-y-3">
        <div v-for="index in 5" :key="`order-details-skeleton-${index}`" class="flex items-center justify-between gap-4">
          <div class="h-4 w-24 animate-pulse rounded bg-grey-55" />
          <div class="h-4 w-32 animate-pulse rounded bg-grey-55" />
        </div>
      </div>
    </section>
    <section class="rounded-[20px] border border-grey-50 bg-white p-5">
      <div class="h-5 w-36 animate-pulse rounded bg-grey-55" />
      <div class="mt-3 border-b border-grey-50" />
      <div class="mt-3 space-y-3">
        <div v-for="index in 5" :key="`customer-details-skeleton-${index}`" class="flex items-center justify-between gap-4">
          <div class="h-4 w-24 animate-pulse rounded bg-grey-55" />
          <div class="h-4 w-36 animate-pulse rounded bg-grey-55" />
        </div>
      </div>
    </section>

    <div class="lg:col-span-2">
      <div class="mb-3 h-4 w-20 animate-pulse rounded bg-grey-55" />
      <AdminOrderLineItemsSection
        :items="[]"
        order-id=""
        order-status="pending"
        payment-status="pending"
        loading
      />
    </div>
  </div>

  <div v-else class="flex flex-col gap-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section class="rounded-[20px] border border-grey-50 bg-white p-5">
        <h2 class="text-base font-semibold text-grey-900">Order details</h2>
        <div class="mt-3 border-b border-grey-50" />
        <dl class="mt-1 divide-y divide-grey-50 text-sm">
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Approved by</dt>
            <dd class="font-medium text-grey-900">{{ view.approvedByName }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Order date</dt>
            <dd class="text-grey-800">{{ view.createdLabel }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Phone number</dt>
            <dd class="text-grey-800">{{ view.phoneNumber }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Payment method & status</dt>
            <dd class="flex flex-wrap items-center justify-end gap-1">
              <span class="font-medium text-grey-900">{{ view.paymentMethodLabel }}</span>
              <OrderPaymentStatusSelect
                v-if="orderId && !paymentReadOnly"
                :order-id="orderId"
                :status="view.paymentStatus"
                :status-label="view.paymentStatusLabel"
                :disabled="paymentStatusUpdating"
                @change="emit('updatePaymentStatus', $event)"
              />
              <StatusTag
                v-else
                :variant="view.paymentStatusVariant"
                size="medium"
                class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
              >
                {{ view.paymentStatusLabel }}
              </StatusTag>
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Delivery address</dt>
            <dd class="min-w-0 text-right font-medium text-grey-900">
              <p>{{ view.addressLine }}</p>
              <p v-if="view.addressDirections" class="mt-1 text-grey-300">
                {{ view.addressDirections }}
              </p>
            </dd>
          </div>
        </dl>
      </section>

      <section class="rounded-[20px] border border-grey-50 bg-white p-5">
        <h2 class="text-base font-semibold text-grey-900">Customer details</h2>
        <div class="mt-3 border-b border-grey-50" />
        <dl class="mt-1 divide-y divide-grey-50 text-sm">
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Full name</dt>
            <dd class="text-right font-medium text-grey-900">{{ view.customerFullName }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Branch</dt>
            <dd class="text-right text-grey-800">{{ view.customerBranch }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Position</dt>
            <dd class="text-right text-grey-800">{{ view.customerPosition }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Phone number</dt>
            <dd class="text-right text-grey-800">{{ view.customerPhone }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-grey-300">Email</dt>
            <dd class="text-right text-grey-800">{{ view.customerEmail }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <AdminOrderLineItemsSection
      v-if="orderId"
      :items="view.lineItems"
      :order-id="orderId"
      :order-status="view.status"
      :payment-status="view.paymentStatus"
      :disabled="paymentStatusUpdating"
      @updated="emit('lineItemsUpdated')"
    />
  </div>
</template>
