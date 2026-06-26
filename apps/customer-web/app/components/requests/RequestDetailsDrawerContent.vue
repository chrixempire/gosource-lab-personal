<script setup lang="ts">
import { SegmentedControl } from '@gosource/ui';
import OrderDetailFieldRow from '~/components/orders/OrderDetailFieldRow.vue';
import RequestProductLinesEditor from '~/components/requests/RequestProductLinesEditor.vue';
import type { RequestDetailsView } from '~/components/requests/RequestDetailsPanel.vue';

const props = defineProps<{
  view: RequestDetailsView | null;
  loading?: boolean;
  refreshing?: boolean;
  editable?: boolean;
  productsEditing?: boolean;
  formatCurrency: (value: number) => string;
}>();

const emit = defineEmits<{
  quantityChange: [cartLineId: string, quantity: number];
  removeLine: [cartLineId: string];
}>();

const activeTab = ref<'cart' | 'details'>('cart');

watch(
  () => props.view?.id,
  () => {
    activeTab.value = 'cart';
  },
);

const tabs = [
  { value: 'cart' as const, label: 'Cart items' },
  { value: 'details' as const, label: 'Details' },
];
</script>

<template>
  <div v-if="loading || !view" class="space-y-4" aria-busy="true">
    <div class="h-11 animate-pulse rounded-xl bg-grey-55" />
    <div
      v-for="index in 4"
      :key="index"
      class="h-20 animate-pulse rounded-2xl bg-grey-55"
    />
  </div>

  <div
    v-else
    class="min-h-0 transition-opacity duration-200"
    :class="refreshing ? 'opacity-75' : undefined"
  >
    <div class="flex items-center gap-2">
      <SegmentedControl
        class="min-w-0 flex-1"
        :model-value="activeTab"
        :options="tabs"
        @update:model-value="activeTab = $event as 'cart' | 'details'"
      />
      <slot name="actions" />
    </div>

    <section v-if="activeTab === 'cart'" class="mt-5">
      <RequestProductLinesEditor
        :products="view.products"
        :editable="editable"
        :disabled="productsEditing"
        :loading="productsEditing"
        list-style
        embedded
        :format-currency="formatCurrency"
        @quantity-change="
          (cartLineId, quantity) => emit('quantityChange', cartLineId, quantity)
        "
        @remove-line="emit('removeLine', $event)"
      />
    </section>

    <div v-else class="mt-5 space-y-4">
      <section
        class="rounded-[18px] border border-grey-50 bg-background-on-canvas p-4"
      >
        <h3 class="text-sm font-semibold text-grey-900">Initiator</h3>
        <div class="mt-3 border-b border-grey-50" />
        <dl class="mt-1">
          <OrderDetailFieldRow label="Full name" :value="view.initiatorName" />
          <OrderDetailFieldRow label="Email" :value="view.initiatorEmail" />
          <OrderDetailFieldRow
            label="Phone number"
            :value="view.initiatorPhone"
          />
          <OrderDetailFieldRow label="Position" :value="view.initiatorRole" />
          <OrderDetailFieldRow label="Branch" :value="view.branchName" />
          <OrderDetailFieldRow label="Created" :value="view.createdLabel" />
        </dl>
      </section>

      <section
        class="rounded-[18px] border border-grey-50 bg-background-on-canvas p-4"
      >
        <h3 class="text-sm font-semibold text-grey-900">Totals</h3>
        <div class="mt-3 border-b border-grey-50" />
        <dl class="mt-1">
          <OrderDetailFieldRow
            label="Order items"
            :value="String(view.products.length)"
          />
          <OrderDetailFieldRow
            label="Subtotal"
            :value="formatCurrency(view.subtotal)"
          />
          <OrderDetailFieldRow
            label="Delivery fee"
            :value="formatCurrency(view.deliveryFee)"
          />
          <OrderDetailFieldRow
            label="Service charge"
            :value="formatCurrency(view.serviceCharge)"
          />
          <OrderDetailFieldRow
            label="Discount"
            :value="formatCurrency(view.discount)"
          />
          <OrderDetailFieldRow
            label="Total"
            :value="formatCurrency(view.totalPrice)"
          />
        </dl>
      </section>
    </div>
  </div>
</template>
