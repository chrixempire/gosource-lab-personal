<script setup lang="ts">
import { Checkbox, cn } from '@gosource/ui';
import OrderActionsMenu from '~/components/orders/OrderActionsMenu.vue';
import OrderPaymentStatusSelect from '~/components/orders/OrderPaymentStatusSelect.vue';
import OrderStatusSelect from '~/components/orders/OrderStatusSelect.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { ORDER_CARD_HEIGHT } from '~/lib/order-list';
import type { AdminOrderListItem, OrderPaymentStatus, OrderStatus } from '~/types/orders';

const props = defineProps<{
  order: AdminOrderListItem;
  updatingOrderId?: string | null;
  selected?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  rowClick: [order: AdminOrderListItem];
  toggleSelected: [orderId: string, checked: boolean | 'indeterminate'];
  updateOrderStatus: [orderId: string, status: OrderStatus];
  updatePaymentStatus: [orderId: string, status: OrderPaymentStatus];
  download: [order: AdminOrderListItem];
  cancel: [order: AdminOrderListItem];
}>();
</script>

<template>
  <article
    :class="
      cn(
        'box-border flex h-full w-full min-w-0 cursor-pointer flex-col rounded-[24px] border border-grey-50 bg-white p-4 text-left shadow-[0_8px_24px_-12px_rgba(16,24,40,0.12)] transition-colors duration-150 hover:border-primary-100 hover:bg-primary-50/50 sm:p-5',
        props.class,
      )
    "
    :style="{ height: `${ORDER_CARD_HEIGHT}px` }"
    @click="emit('rowClick', order)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 text-left">
        <div class="flex min-w-0 items-start gap-2">
          <Checkbox
            :model-value="selected"
            :aria-label="`Select order ${order.referenceLabel}`"
            class="mt-0.5 shrink-0"
            @update:model-value="emit('toggleSelected', order.id, $event)"
            @click.stop
          />
          <p class="truncate font-semibold text-grey-900">{{ order.referenceLabel }}</p>
        </div>
        <p class="mt-0.5 text-sm text-grey-300">{{ order.createdLabel }}</p>
      </div>
      <OrderActionsMenu
        :order="order"
        @view="emit('rowClick', order)"
        @download="emit('download', order)"
        @cancel="emit('cancel', order)"
      />
    </div>

    <p class="mt-3 truncate text-left text-sm text-grey-700">{{ order.customerName }}</p>

    <div class="mt-4 grid grid-cols-2 gap-3 text-left auto-rows-fr">
      <AdminMobileCardStat label="Total">{{ order.totalLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Items">{{ order.itemCountLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Payment">{{ order.paymentMethodLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Payment status">
        <OrderPaymentStatusSelect
          :order-id="order.id"
          :status="order.paymentStatus"
          :status-label="order.paymentStatusLabel"
          :disabled="updatingOrderId === order.id"
          @change="emit('updatePaymentStatus', order.id, $event)"
          @click.stop
        />
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Status">
        <div class="flex justify-start" @click.stop>
          <OrderStatusSelect
            :order-id="order.id"
            :status="order.status"
            :status-label="order.statusLabel"
            :disabled="updatingOrderId === order.id"
            @change="emit('updateOrderStatus', order.id, $event)"
          />
        </div>
      </AdminMobileCardStat>
    </div>
  </article>
</template>
