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
import {
  ORDER_LIST_PANEL_CLASS,
  ORDER_TABLE_GRID_TEMPLATE,
  ORDER_TABLE_SKELETON_COLUMNS,
  ORDER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/orders-table-layout';

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

const skeletonRowCount = computed(() => Math.max(1, Math.min(props.pageSize, 15)));
</script>

<template>
  <TableShell :class="[ORDER_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader :class="ORDER_TABLE_STICKY_HEADER_CLASS">
      <TableHeadRow
        :style="{ gridTemplateColumns: ORDER_TABLE_GRID_TEMPLATE }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell>Order</TableCell>
        <TableCell>Branch</TableCell>
        <TableCell>Total</TableCell>
        <TableCell>Items</TableCell>
        <TableCell>Date</TableCell>
        <TableCell>Status</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="ORDER_TABLE_SKELETON_COLUMNS"
      :grid-template-columns="ORDER_TABLE_GRID_TEMPLATE"
      :row-count="skeletonRowCount"
      body-class="!max-h-none !overflow-visible"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="order in orders"
        :key="order.id"
        :data-testid="`order-row-${order.id}`"
        class="cursor-pointer transition-colors duration-150 hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: ORDER_TABLE_GRID_TEMPLATE }"
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
          <p class="truncate text-sm font-medium text-grey-900">
            {{ order.branchName }}
          </p>
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
