<script setup lang="ts">
import { Checkbox, StatusTag, cn } from '@gosource/ui';
import PurchaseOrderActionsMenu from '~/components/purchase-orders/PurchaseOrderActionsMenu.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { purchaseOrderStatusVariant } from '~/lib/purchase-order-constants';
import type { AdminPurchaseOrderListItem } from '~/types/purchase-orders';

const props = defineProps<{
  order: AdminPurchaseOrderListItem;
  selected?: boolean;
  busy?: boolean;
  loading?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  rowClick: [order: AdminPurchaseOrderListItem];
  toggleSelect: [orderId: string, selected: boolean];
  viewInvoice: [order: AdminPurchaseOrderListItem];
  receive: [order: AdminPurchaseOrderListItem];
  edit: [order: AdminPurchaseOrderListItem];
  sendInvoice: [order: AdminPurchaseOrderListItem];
  download: [order: AdminPurchaseOrderListItem];
  cancelRemaining: [order: AdminPurchaseOrderListItem];
  deleteOrder: [order: AdminPurchaseOrderListItem];
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
    @click="emit('rowClick', order)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          :model-value="selected"
          aria-label="Select purchase order"
          @click.stop
          @update:model-value="emit('toggleSelect', order.id, $event === true)"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-grey-900">{{ order.referenceLabel }}</p>
          <p class="mt-0.5 text-sm text-grey-500">{{ order.createdAtLabel }}</p>
        </div>
      </div>
      <PurchaseOrderActionsMenu
        :order="order"
        :disabled="busy"
        :loading="loading || busy"
        @view-invoice="emit('viewInvoice', order)"
        @receive="emit('receive', order)"
        @edit="emit('edit', order)"
        @send-invoice="emit('sendInvoice', order)"
        @download="emit('download', order)"
        @cancel-remaining="emit('cancelRemaining', order)"
        @delete-order="emit('deleteOrder', order)"
      />
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <StatusTag :variant="purchaseOrderStatusVariant(order.status)" size="medium">
        {{ order.statusLabel }}
      </StatusTag>
      <span class="rounded-lg bg-grey-55 px-2 py-0.5 text-xs text-grey-700">
        {{ order.productTypeLabel }}
      </span>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Items total">
        {{ order.itemsTotalLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Products">
        {{ order.itemsCount }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Received">
        {{ order.quantityReceived }} of {{ order.quantityOrdered }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Expected">
        <span :class="order.expectedDateOverdue ? 'text-negative-500' : undefined">
          {{ order.expectedDateLabel }}
        </span>
      </AdminMobileCardStat>
    </div>

    <div class="mt-4 space-y-1.5">
      <div
        class="h-2.5 overflow-hidden rounded-full"
        :class="
          order.receivePercent > 0 && order.receivePercent < 100
            ? 'border border-grey-200 bg-grey-55'
            : order.receivePercent === 100
              ? 'bg-grey-55'
            : 'border border-grey-200 bg-grey-200'
        "
      >
        <div
          v-if="order.receivePercent > 0"
          class="h-full rounded-full bg-primary-500 transition-all"
          :style="{ width: `${order.receivePercent}%` }"
        />
      </div>
      <p class="text-xs text-grey-500">
        {{ order.quantityReceived }} of {{ order.quantityOrdered }}
      </p>
    </div>
  </article>
</template>
