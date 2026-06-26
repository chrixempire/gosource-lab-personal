<script setup lang="ts">
import { PaginationBar, StatusTag } from '@gosource/ui';
import type { AdminOrderListItem } from '~/types/orders';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';

type OrderRow = {
  id: string;
  referenceLabel: string;
  createdLabel: string;
  itemCountLabel: string;
  totalLabel: string;
  statusVariant: AdminOrderListItem['statusVariant'];
  statusLabel: string;
  paymentStatusVariant: AdminOrderListItem['paymentStatusVariant'];
  paymentStatusLabel: string;
};

defineProps<{
  rows: OrderRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  pending?: boolean;
  error?: unknown;
}>();

const emit = defineEmits<{
  retry: [];
  page: [page: number];
  pageSize: [size: number];
}>();
</script>

<template>
  <div class="space-y-4">
    <AdminMobileCardsSkeleton v-if="pending" :count="8" />

    <LoadErrorState
      v-else-if="error && rows.length === 0"
      compact
      :error="error"
      load-failed-title="Unable to load order history"
      resource-label="order history"
      @retry="emit('retry')"
    />

    <p
      v-else-if="!rows.length"
      class="rounded-xl border border-grey-50 bg-white px-4 py-10 text-center text-sm text-grey-500"
    >
      No orders found
    </p>

    <template v-else>
      <div :class="CREDIT_CARDS_GRID_CLASS">
        <article
          v-for="order in rows"
          :key="order.id"
          :class="CREDIT_CARD_SHELL_CLASS"
          @click="navigateTo(`${ADMIN_PAGE_ROUTES.ORDERS}/${order.id}`)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-grey-900">{{ order.referenceLabel }}</p>
              <p class="mt-1 text-xs text-grey-500">{{ order.createdLabel }}</p>
            </div>
            <StatusTag :variant="order.statusVariant" size="medium">
              {{ order.statusLabel }}
            </StatusTag>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <AdminMobileCardStat label="Items">{{ order.itemCountLabel }}</AdminMobileCardStat>
            <AdminMobileCardStat label="Total">{{ order.totalLabel }}</AdminMobileCardStat>
          </div>
          <div class="mt-3">
            <StatusTag :variant="order.paymentStatusVariant" size="medium">
              {{ order.paymentStatusLabel }}
            </StatusTag>
          </div>
        </article>
      </div>

      <PaginationBar
        v-if="meta.total > 0"
        :page="meta.page"
        :page-size="meta.limit"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </template>
  </div>
</template>
