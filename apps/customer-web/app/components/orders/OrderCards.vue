<script setup lang="ts">
import { Avatar, StatusTag } from '@gosource/ui';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import OrderActionsMenu from '~/components/orders/OrderActionsMenu.vue';
import type { OrderListItem } from '~/lib/order-details';

withDefaults(
  defineProps<{
    orders: OrderListItem[];
    reorderLoading?: boolean;
    reorderLoadingOrderId?: string | null;
    hideActions?: boolean;
  }>(),
  {
    hideActions: false,
  },
);

const emit = defineEmits<{
  click: [order: OrderListItem];
  viewDetails: [order: OrderListItem];
  reorder: [order: OrderListItem];
}>();
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:gap-4">
    <article
      v-for="order in orders"
      :key="order.id"
      class="w-full min-w-0 cursor-pointer rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_12px_32px_-24px_rgba(16,24,40,0.14)] transition-colors duration-150 hover:bg-primary-50/30 lg:max-w-[500px] lg:flex-[1_1_320px] lg:rounded-[24px] lg:p-5"
      @click="emit('click', order)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <div
            v-if="order.imageUrl"
            class="relative size-10 shrink-0 overflow-hidden rounded-lg bg-grey-55"
          >
            <MarketProductImage
              :src="order.imageUrl"
              :alt="order.productTitle"
              :hover-zoom="false"
            />
          </div>
          <Avatar
            v-else
            size="md"
            :alt="order.productTitle"
            :fallback="order.initials"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <h2 class="break-words text-base font-semibold leading-snug text-grey-900">
              {{ order.reference }}
            </h2>
            <p class="break-words text-sm text-grey-300">
              {{ order.productTitle }}
            </p>
            <p v-if="order.productSubtitle" class="break-words text-xs text-grey-300">
              {{ order.productSubtitle }}
            </p>
          </div>
        </div>

        <OrderActionsMenu
          v-if="!hideActions"
          class="shrink-0"
          :reorder-loading="reorderLoading"
          :is-reordering="reorderLoadingOrderId === order.id"
          @view-details="emit('viewDetails', order)"
          @reorder="emit('reorder', order)"
        />
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <StatusTag
          :variant="order.statusVariant"
          size="medium"
          class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ order.statusLabel }}
        </StatusTag>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Branch
          </p>
          <p class="mt-1 break-words text-sm font-semibold text-grey-900">
            {{ order.branchName }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Items
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ order.itemsCountLabel }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Created
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ order.createdLabel }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Total
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ order.totalLabel }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
