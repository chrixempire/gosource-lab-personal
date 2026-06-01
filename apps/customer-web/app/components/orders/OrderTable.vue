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
import OrderCards from '~/components/orders/OrderCards.vue';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import type { OrderListItem } from '~/lib/order-details';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_DATA_ROW_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/customer-table-layout';
import {
  ORDER_TABLE_GRID_TEMPLATE,
  ORDER_TABLE_GRID_TEMPLATE_NO_ACTIONS,
  ORDER_TABLE_SKELETON_COLUMNS,
  ORDER_TABLE_SKELETON_COLUMNS_NO_ACTIONS,
} from '~/lib/orders-table-layout';

const props = withDefaults(
  defineProps<{
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
    emptyTitle?: string;
    emptyDescription?: string;
    periodLabel?: string;
    hideActions?: boolean;
    hidePagination?: boolean;
  }>(),
  {
    emptyTitle: 'No orders found for the current filters.',
    hideActions: false,
    hidePagination: false,
  },
);

const tableGridTemplate = computed(() =>
  props.hideActions ? ORDER_TABLE_GRID_TEMPLATE_NO_ACTIONS : ORDER_TABLE_GRID_TEMPLATE,
);

const skeletonColumns = computed(() =>
  props.hideActions ? ORDER_TABLE_SKELETON_COLUMNS_NO_ACTIONS : ORDER_TABLE_SKELETON_COLUMNS,
);

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [order: OrderListItem];
  viewDetails: [order: OrderListItem];
  reorder: [order: OrderListItem];
}>();

const skeletonRowCount = computed(() => Math.max(1, Math.min(props.pageSize, 15)));

const showEmpty = computed(() => !props.loading && props.orders.length === 0);
const showPagination = computed(
  () => !props.hidePagination && !props.loading && props.orders.length > 0,
);
</script>

<template>
  <div>
    <div class="space-y-3 lg:hidden">
      <div v-if="loading" class="space-y-3">
        <div
          v-for="index in Math.min(pageSize, 5)"
          :key="index"
          class="h-[280px] animate-pulse rounded-[16px] border border-grey-50 bg-grey-55"
        />
      </div>

      <OrderCards
        v-else-if="orders.length > 0"
        :orders="orders"
        :hide-actions="hideActions"
        :reorder-loading="reorderLoading"
        :reorder-loading-order-id="reorderLoadingOrderId"
        @click="emit('rowClick', $event)"
        @view-details="emit('viewDetails', $event)"
        @reorder="emit('reorder', $event)"
      />

      <div
        v-if="showEmpty"
        class="flex min-h-[220px] flex-col items-center justify-center rounded-[16px] border border-grey-50 bg-background-on-canvas px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">
          {{ emptyTitle }}
        </p>
        <p v-if="emptyDescription" class="mt-2 text-sm text-grey-300">
          {{ emptyDescription }}
        </p>
        <p v-if="periodLabel" class="mt-1 text-xs text-grey-300">
          Period: {{ periodLabel }}
        </p>
      </div>

      <PaginationBar
        v-if="showPagination"
        plain
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </div>

    <TableShell :class="[CUSTOMER_TABLE_PANEL_CLASS, 'hidden overflow-visible lg:block']">
    <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
      <TableHeadRow
        :style="{ gridTemplateColumns: tableGridTemplate }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell>Order</TableCell>
        <TableCell>Branch</TableCell>
        <TableCell>Total</TableCell>
        <TableCell>Items</TableCell>
        <TableCell>Date</TableCell>
        <TableCell>Status</TableCell>
        <TableCell v-if="!hideActions" class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="skeletonColumns"
      :grid-template-columns="tableGridTemplate"
      :row-count="skeletonRowCount"
      :body-class="CUSTOMER_TABLE_BODY_CLASS"
    />

    <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
      <TableRow
        v-for="order in orders"
        :key="order.id"
        :data-testid="`order-row-${order.id}`"
        :class="CUSTOMER_TABLE_DATA_ROW_CLASS"
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

        <TableCell v-if="!hideActions" class="flex items-center justify-end" @click.stop>
          <OrderActionsMenu
            :reorder-loading="reorderLoading"
            :is-reordering="reorderLoadingOrderId === order.id"
            @view-details="emit('viewDetails', order)"
            @reorder="emit('reorder', order)"
          />
        </TableCell>
      </TableRow>

      <div
        v-if="showEmpty"
        class="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">
          {{ emptyTitle }}
        </p>
        <p v-if="emptyDescription" class="mt-2 text-sm text-grey-300">
          {{ emptyDescription }}
        </p>
        <p v-if="periodLabel" class="mt-1 text-xs text-grey-300">
          Period: {{ periodLabel }}
        </p>
      </div>
    </TableBody>

    <TableFooter v-if="showPagination">
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
  </div>
</template>
