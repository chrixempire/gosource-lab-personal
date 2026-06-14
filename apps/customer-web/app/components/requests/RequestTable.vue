<script setup lang="ts">
import {
  Avatar,
  Button,
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
import RequestActionsMenu from '~/components/requests/RequestActionsMenu.vue';
import RequestCards from '~/components/requests/RequestCards.vue';
import RequestCardsSkeleton from '~/components/requests/RequestCardsSkeleton.vue';
import type { RequestListItem } from './RequestCards.vue';
import { CUSTOMER_TABLE_BODY_CLASS, CUSTOMER_TABLE_DATA_ROW_CLASS } from '~/lib/customer-table-layout';
import {
  REQUEST_LIST_PANEL_CLASS,
  REQUEST_TABLE_GRID_TEMPLATE,
  REQUEST_TABLE_SKELETON_COLUMNS,
  REQUEST_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/requests-table-layout';

const props = withDefaults(
  defineProps<{
    requests: RequestListItem[];
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    loading?: boolean;
    layout?: 'table' | 'cards';
    canApproveReject?: (request: RequestListItem) => boolean;
    canCancel?: (request: RequestListItem) => boolean;
    canEdit?: (request: RequestListItem) => boolean;
    canAddMore?: (request: RequestListItem) => boolean;
    canReopen?: (request: RequestListItem) => boolean;
    canCheckout?: (request: RequestListItem) => boolean;
    /** Shown when there are no rows (filters empty or branch setup required). */
    emptyMessage?: string;
  }>(),
  {
    layout: 'table',
    emptyMessage: 'No requests found for the current filters.',
  },
);

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [request: RequestListItem];
  viewDetails: [request: RequestListItem];
  edit: [request: RequestListItem];
  addMore: [request: RequestListItem];
  reopen: [request: RequestListItem];
  checkout: [request: RequestListItem];
  approve: [request: RequestListItem];
  reject: [request: RequestListItem];
  cancel: [request: RequestListItem];
}>();

const skeletonRowCount = computed(() => Math.max(1, Math.min(props.pageSize, 15)));
const showCardsLayout = computed(() => props.layout === 'cards');
const showDesktopTable = computed(() => props.layout === 'table');
const showEmpty = computed(() => !props.loading && props.requests.length === 0);
const showPagination = computed(
  () => !props.loading && (props.requests.length > 0 || props.totalItems > 0),
);

const cardsSectionClass = computed(() =>
  showCardsLayout.value ? 'p-4 sm:p-5' : 'p-4 sm:p-5 min-[1000px]:hidden',
);

const desktopTableSectionClass = computed(() =>
  showDesktopTable.value ? 'hidden min-[1000px]:block' : 'hidden',
);
</script>

<template>
  <TableShell :class="[REQUEST_LIST_PANEL_CLASS, 'overflow-visible']">
    <div :class="desktopTableSectionClass">
      <TableHeader :class="REQUEST_TABLE_STICKY_HEADER_CLASS">
        <TableHeadRow
          :style="{ gridTemplateColumns: REQUEST_TABLE_GRID_TEMPLATE }"
          :class="loading ? 'pointer-events-none opacity-60' : undefined"
        >
          <TableCell>Request</TableCell>
          <TableCell>Initiator</TableCell>
          <TableCell>Branch</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Total</TableCell>
          <TableCell>Checkout</TableCell>
          <TableCell class="sr-only">Actions</TableCell>
        </TableHeadRow>
      </TableHeader>

      <TableSkeleton
        v-if="loading"
        :columns="REQUEST_TABLE_SKELETON_COLUMNS"
        :grid-template-columns="REQUEST_TABLE_GRID_TEMPLATE"
        :row-count="skeletonRowCount"
        :body-class="CUSTOMER_TABLE_BODY_CLASS"
      />

      <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
        <TableRow
          v-for="request in requests"
          :key="request.id"
          :data-testid="`request-row-${request.id}`"
          :class="CUSTOMER_TABLE_DATA_ROW_CLASS"
          :style="{ gridTemplateColumns: REQUEST_TABLE_GRID_TEMPLATE }"
          @click="emit('rowClick', request)"
        >
          <TableCell class="flex items-center gap-3">
            <Avatar
              size="sm"
              :alt="request.initiatorName"
              :fallback="request.initials"
            />
            <div class="min-w-0">
              <p class="truncate text-base font-semibold text-grey-900">
                {{ request.reference }}
              </p>
              <p class="truncate text-sm text-grey-300">
                {{ request.itemsCountLabel }} · {{ request.createdLabel }}
              </p>
            </div>
          </TableCell>

          <TableCell>
            <p class="truncate text-sm font-medium text-grey-900">
              {{ request.initiatorName }}
            </p>
            <p class="truncate text-sm text-grey-300">
              {{ request.initiatorEmail }}
            </p>
          </TableCell>

          <TableCell>
            <p class="truncate text-sm font-medium text-grey-900">
              {{ request.branchName }}
            </p>
          </TableCell>

          <TableCell>
            <StatusTag
              :variant="request.statusVariant"
              size="medium"
              class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
            >
              {{ request.statusLabel }}
            </StatusTag>
          </TableCell>

          <TableCell>
            <p class="text-sm font-medium text-grey-900">
              {{ request.amountLabel }}
            </p>
          </TableCell>

          <TableCell class="flex items-center justify-start" @click.stop>
            <Button
              v-if="props.canCheckout?.(request)"
              variant="primary"
              size="small"
              class="!w-auto whitespace-nowrap"
              @click="emit('checkout', request)"
            >
              Checkout
            </Button>
            <span v-else class="text-sm text-grey-300">-- --</span>
          </TableCell>

          <TableCell class="flex items-center justify-end" @click.stop>
            <RequestActionsMenu
              :can-approve-reject="props.canApproveReject?.(request)"
              :can-cancel="props.canCancel?.(request)"
              :can-edit="props.canEdit?.(request)"
              :can-add-more="props.canAddMore?.(request)"
              :can-reopen="props.canReopen?.(request)"
              :show-approve-action="!props.canCheckout?.(request)"
              view-details-label="View request"
              approve-label="Checkout"
              @view-details="emit('viewDetails', request)"
              @edit="emit('edit', request)"
              @add-more="emit('addMore', request)"
              @reopen="emit('reopen', request)"
              @approve="emit('approve', request)"
              @reject="emit('reject', request)"
              @cancel="emit('cancel', request)"
            />
          </TableCell>
        </TableRow>

        <div
          v-if="showEmpty"
          class="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-grey-300"
        >
          {{ emptyMessage }}
        </div>
      </TableBody>
    </div>

    <div v-if="showCardsLayout || showDesktopTable" :class="cardsSectionClass">
      <RequestCardsSkeleton v-if="loading" />

      <template v-else>
        <RequestCards
          v-if="requests.length > 0"
          :requests="requests"
          :can-approve-reject="canApproveReject"
          :can-cancel="canCancel"
          :can-edit="canEdit"
          :can-add-more="canAddMore"
          :can-reopen="canReopen"
          :can-checkout="canCheckout"
          @click="emit('rowClick', $event)"
          @view-details="emit('viewDetails', $event)"
          @edit="emit('edit', $event)"
          @add-more="emit('addMore', $event)"
          @reopen="emit('reopen', $event)"
          @checkout="emit('checkout', $event)"
          @approve="emit('approve', $event)"
          @reject="emit('reject', $event)"
          @cancel="emit('cancel', $event)"
        />

        <div
          v-else
          class="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-grey-50 bg-background-on-canvas px-6 py-12 text-center text-sm text-grey-300"
        >
          {{ emptyMessage }}
        </div>
      </template>
    </div>

    <TableFooter v-if="showPagination">
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :visible-count="requests.length"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        :disabled="loading"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
