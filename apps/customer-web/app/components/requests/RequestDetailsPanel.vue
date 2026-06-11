<script setup lang="ts">
import type { RequestRecord } from '@gosource/api-client';
import { StatusTag } from '@gosource/ui';
import { Info } from 'lucide-vue-next';
import OrderDetailFieldRow from '~/components/orders/OrderDetailFieldRow.vue';
import RequestProductLinesEditor from '~/components/requests/RequestProductLinesEditor.vue';

export type RequestDetailsView = {
  id: string;
  reference: string;
  branchName: string;
  branchCode: string | null;
  branchOrderLabel: string;
  statusLabel: string;
  statusVariant: 'success' | 'negative' | 'warning';
  paymentStatusLabel: string;
  paymentStatusVariant: 'success' | 'negative' | 'warning';
  paymentMethod: string | null;
  initiatorName: string;
  initiatorEmail: string;
  initiatorPhone: string;
  initiatorRole: string;
  phoneNumber: string;
  createdLabel: string;
  approverName: string | null;
  approverEmail: string | null;
  approverPhone: string | null;
  approverRole: string | null;
  approvedAtLabel: string | null;
  addressLine: string;
  addressDirections: string | null;
  products: RequestRecord['products'];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  totalPrice: number;
  rejectedReasons: string | null;
};

const props = defineProps<{
  view: RequestDetailsView | null;
  loading?: boolean;
  refreshing?: boolean;
  /** Side-by-side order/created and payment/address rows (request details page). */
  pageLayout?: boolean;
  editable?: boolean;
  productsEditing?: boolean;
  formatCurrency: (value: number) => string;
  /** Shown in the wallet-style info banner (e.g. edit restrictions). */
  infoMessage?: string;
}>();

const emit = defineEmits<{
  quantityChange: [cartLineId: string, quantity: number];
  removeLine: [cartLineId: string];
}>();
</script>

<template>
  <div v-if="loading || !view" class="space-y-5" aria-busy="true" aria-label="Loading request details">
    <template v-if="props.pageLayout">
      <div class="animate-pulse">
        <div class="h-3 w-28 rounded bg-grey-50" />
        <div class="mt-3 h-8 w-48 max-w-full rounded bg-grey-50" />
        <div class="mt-2 h-4 w-24 rounded bg-grey-50" />
      </div>

      <div
        v-if="props.infoMessage"
        class="h-12 animate-pulse rounded-[12px] border border-sky-200 bg-sky-50"
      />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-3">
          <div class="h-5 w-36 animate-pulse rounded bg-grey-50" />
          <div class="mt-3 h-px w-full bg-grey-50" />
          <div class="mt-4 space-y-2">
            <div v-for="index in 7" :key="index" class="h-10 animate-pulse rounded bg-grey-55" />
          </div>
        </div>
        <div class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-2">
          <div class="h-5 w-32 animate-pulse rounded bg-grey-50" />
          <div class="mt-3 h-px w-full bg-grey-50" />
          <div class="mt-4 space-y-2">
            <div v-for="index in 5" :key="index" class="h-10 animate-pulse rounded bg-grey-55" />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5">
        <div class="animate-pulse">
          <div class="mb-5 min-w-0">
            <div class="h-3 w-24 rounded bg-grey-50" />
            <div class="mt-3 h-7 w-48 max-w-[70%] rounded bg-grey-50" />
            <div class="mt-2 h-4 w-20 rounded bg-grey-50" />
          </div>
        </div>
      </div>
    </template>

    <div :class="props.pageLayout ? undefined : 'rounded-[18px] border border-grey-50 bg-background-on-canvas p-4'">
      <div
        v-if="!props.pageLayout"
        class="mb-3 h-3 w-20 animate-pulse rounded-full bg-grey-100"
      />
      <RequestProductLinesEditor
        :products="[]"
        loading
        :embedded="props.pageLayout"
        :list-style="!props.pageLayout"
        :format-currency="formatCurrency"
      />
    </div>

    <div class="customer-pricing-summary animate-pulse rounded-[16px] p-4">
      <div class="mb-3 h-3 w-16 rounded-full bg-grey-100" />
      <div class="space-y-2">
        <div
          v-for="index in 4"
          :key="index"
          class="h-4 rounded-md bg-grey-55"
        />
      </div>
    </div>
  </div>

  <div
    v-else
    class="space-y-5 transition-opacity duration-200"
    :class="refreshing ? 'opacity-80' : undefined"
  >
    <template v-if="props.pageLayout">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Order request
        </p>
        <p class="mt-1 text-xl font-semibold text-grey-900 sm:text-2xl">
          {{ view.reference }}
        </p>
        <p
          v-if="view.branchName"
          class="mt-0.5 text-sm text-grey-300"
        >
          {{ view.branchName }}
        </p>
      </div>

      <p
        v-if="props.infoMessage"
        class="flex gap-2 rounded-[12px] border border-sky-200 bg-sky-50 p-2 text-sm leading-5 text-sky-800"
      >
        <Info class="size-4 shrink-0 text-sky-600" aria-hidden="true" />
        <span>{{ props.infoMessage }}</span>
      </p>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-3">
          <h2 class="text-base font-semibold text-grey-900">
            Initiator details
          </h2>
          <div class="mt-3 border-b border-grey-50" />
          <dl class="mt-1">
            <OrderDetailFieldRow label="Full name" :value="view.initiatorName" />
            <OrderDetailFieldRow label="Email" :value="view.initiatorEmail" />
            <OrderDetailFieldRow label="Phone number" :value="view.initiatorPhone" />
            <OrderDetailFieldRow label="Role" :value="view.initiatorRole" />
            <OrderDetailFieldRow label="Created" :value="view.createdLabel" />
            <div class="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt class="shrink-0 text-grey-300">
                Delivery address
              </dt>
              <dd class="min-w-0 text-right font-medium leading-6 text-grey-900">
                <p>{{ view.addressLine }}</p>
                <p v-if="view.addressDirections" class="mt-1 text-grey-300">
                  {{ view.addressDirections }}
                </p>
              </dd>
            </div>
            <div class="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt class="shrink-0 text-grey-300">
                Payment method & status
              </dt>
              <dd class="flex min-w-0 flex-wrap items-center justify-end gap-1">
                <span class="font-medium text-grey-900">{{ view.paymentMethod ?? '—' }}</span>
                <StatusTag
                  :variant="view.paymentStatusVariant"
                  size="medium"
                  class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
                >
                  {{ view.paymentStatusLabel }}
                </StatusTag>
              </dd>
            </div>
          </dl>
        </section>

        <section class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5 lg:col-span-2">
          <h2 class="text-base font-semibold text-grey-900">
            Approver details
          </h2>
          <div class="mt-3 border-b border-grey-50" />
          <dl class="mt-1">
            <OrderDetailFieldRow label="Full name" :value="view.approverName ?? '—'" />
            <OrderDetailFieldRow label="Email" :value="view.approverEmail ?? '—'" />
            <OrderDetailFieldRow label="Phone number" :value="view.approverPhone ?? '—'" />
            <OrderDetailFieldRow label="Role" :value="view.approverRole ?? '—'" />
            <OrderDetailFieldRow label="Approved at" :value="view.approvedAtLabel ?? '—'" />
          </dl>
        </section>
      </div>
    </template>

    <template v-else>
      <div class="rounded-[20px] border border-grey-50 bg-background-on-canvas p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-grey-300">
              Order request
            </p>
            <p class="mt-1 text-[20px] font-semibold text-grey-900">
              {{ view.reference }}
            </p>
            <p class="mt-1 text-sm text-grey-300">
              {{ view.branchOrderLabel }}
            </p>
          </div>
          <StatusTag
            :variant="view.statusVariant"
            size="medium"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ view.statusLabel }}
          </StatusTag>
        </div>
      </div>

      <div class="grid gap-3 min-[480px]:grid-cols-2">
        <div class="rounded-[16px] border border-grey-50 bg-background-on-canvas p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Initiator
          </p>
          <p class="mt-2 font-medium text-grey-900">
            {{ view.initiatorName }}
          </p>
          <p class="mt-0.5 text-sm text-grey-300">
            {{ view.initiatorEmail }}
          </p>
        </div>

        <div class="rounded-[16px] border border-grey-50 bg-background-on-canvas p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Phone
          </p>
          <p class="mt-2 font-medium text-grey-900">
            {{ view.initiatorPhone }}
          </p>
        </div>

        <div class="rounded-[16px] border border-grey-50 bg-background-on-canvas p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Payment method & status
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span
              v-if="view.paymentMethod"
              class="text-sm font-medium text-grey-900"
            >
              {{ view.paymentMethod }}
            </span>
            <StatusTag
              :variant="view.paymentStatusVariant"
              size="medium"
              class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
            >
              {{ view.paymentStatusLabel }}
            </StatusTag>
          </div>
        </div>

        <div class="rounded-[16px] border border-grey-50 bg-background-on-canvas p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Created
          </p>
          <p class="mt-2 font-medium text-grey-900">
            {{ view.createdLabel }}
          </p>
        </div>
      </div>

      <div class="rounded-[18px] border border-grey-50 bg-background-on-canvas p-4">
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Delivery address
        </p>
        <p class="text-sm leading-6 text-grey-text">
          {{ view.addressLine }}
        </p>
        <p
          v-if="view.addressDirections"
          class="mt-2 text-sm leading-6 text-grey-300"
        >
          {{ view.addressDirections }}
        </p>
      </div>
    </template>

    <div :class="props.pageLayout ? undefined : 'rounded-[18px] border border-grey-50 bg-background-on-canvas p-4'">
      <p
        class="mb-3 text-sm font-semibold text-grey-900"
        :class="props.pageLayout ? undefined : 'text-xs uppercase tracking-[0.12em] text-grey-300'"
      >
        Products
      </p>
      <RequestProductLinesEditor
        :products="view.products"
        :format-currency="formatCurrency"
        :editable="editable"
        :embedded="props.pageLayout"
        :list-style="!props.pageLayout"
        :disabled="productsEditing"
        :loading="productsEditing"
        @quantity-change="(cartLineId, quantity) => emit('quantityChange', cartLineId, quantity)"
        @remove-line="(cartLineId) => emit('removeLine', cartLineId)"
      />
    </div>

    <div class="customer-pricing-summary rounded-[16px] p-4">
      <p class="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-grey-900">
        Totals
      </p>
      <div class="space-y-2 text-sm">
        <div class="flex items-center justify-between text-grey-900">
          <span>Subtotal</span>
          <span>{{ formatCurrency(view.subtotal) }}</span>
        </div>
        <div class="flex items-center justify-between text-grey-900">
          <span>Delivery fee</span>
          <span>{{ formatCurrency(view.deliveryFee) }}</span>
        </div>
        <div class="flex items-center justify-between text-grey-900">
          <span>Service charge</span>
          <span>{{ formatCurrency(view.serviceCharge) }}</span>
        </div>
        <div class="flex items-center justify-between text-grey-900">
          <span>Discount</span>
          <span>{{ formatCurrency(view.discount) }}</span>
        </div>
        <div class="flex items-center justify-between border-t border-grey-50 pt-2 text-base font-semibold text-grey-900 dark:border-grey-50/80">
          <span>Total</span>
          <span>{{ formatCurrency(view.totalPrice) }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="view.rejectedReasons"
      class="rounded-[18px] border border-negative-200 bg-negative-50 p-4"
    >
      <p class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-negative-500">
        Rejection reason
      </p>
      <p class="text-sm leading-6 text-negative-600">
        {{ view.rejectedReasons }}
      </p>
    </div>
  </div>
</template>
