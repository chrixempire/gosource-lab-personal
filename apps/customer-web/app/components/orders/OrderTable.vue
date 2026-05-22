<script setup lang="ts">
import {
  Avatar,
  PaginationBar,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeadRow,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import OrderActionsMenu from '~/components/orders/OrderActionsMenu.vue';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import type { OrderListItem } from '~/lib/order-details';

const props = defineProps<{
  orders: OrderListItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  loading?: boolean;
  reorderLoading?: boolean;
  reorderLoadingOrderId?: string | null;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [order: OrderListItem];
  viewDetails: [order: OrderListItem];
  reorder: [order: OrderListItem];
}>();

const tableGridTemplate =
  'minmax(0,1.6fr) minmax(0,0.75fr) minmax(0,0.7fr) minmax(0,0.85fr) minmax(0,0.85fr) 3rem';

const skeletonColumns = [
  {
    kind: 'stack' as const,
    avatar: true,
    lineClass: 'w-full',
    sublineClass: 'w-4/5',
  },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-16' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'line' as const, lineClass: 'h-8 w-14' },
];
</script>

<template>
  <TableShell class="flex flex-col">
    <TableHeader>
      <TableHeadRow
        :style="{ gridTemplateColumns: tableGridTemplate }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell>Order</TableCell>
        <TableCell>Total</TableCell>
        <TableCell>Items</TableCell>
        <TableCell>Date</TableCell>
        <TableCell>Status</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="skeletonColumns"
      :grid-template-columns="tableGridTemplate"
    />

    <TableBody v-else>
      <TableRow
        v-for="order in orders"
        :key="order.id"
        :data-testid="`order-row-${order.id}`"
        class="cursor-pointer transition-colors duration-150 hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: tableGridTemplate }"
        @click="emit('rowClick', order)"
      >
        <TableCell class="flex items-center gap-3">
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
            size="sm"
            :alt="order.productTitle"
            :fallback="order.initials"
          />
          <div class="min-w-0">
            <p class="truncate text-base font-semibold text-grey-900">
              {{ order.reference }}
            </p>
            <p class="truncate text-sm text-grey-300">
              {{ order.productTitle }}
              <span v-if="order.productSubtitle"> · {{ order.productSubtitle }}</span>
            </p>
          </div>
        </TableCell>

        <TableCell>
          <p class="text-sm font-semibold text-grey-900">
            {{ order.totalLabel }}
          </p>
        </TableCell>

        <TableCell>
          <p class="text-sm text-grey-900">
            {{ order.itemsCountLabel }}
          </p>
        </TableCell>

        <TableCell>
          <p class="text-sm text-grey-900">
            {{ order.createdLabel }}
          </p>
        </TableCell>

        <TableCell>
          <StatusTag :variant="order.statusVariant">
            {{ order.statusLabel }}
          </StatusTag>
        </TableCell>

        <TableCell class="flex items-center justify-end">
          <OrderActionsMenu
            :reorder-loading="reorderLoading"
            :is-reordering="reorderLoadingOrderId === order.id"
            @view-details="emit('viewDetails', order)"
            @reorder="emit('reorder', order)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && orders.length > 0">
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
