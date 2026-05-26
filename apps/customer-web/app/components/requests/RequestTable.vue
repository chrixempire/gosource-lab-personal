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
import type { RequestListItem } from './RequestCards.vue';
import {
  REQUEST_LIST_PANEL_CLASS,
  REQUEST_TABLE_GRID_TEMPLATE,
  REQUEST_TABLE_SKELETON_COLUMNS,
  REQUEST_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/requests-table-layout';

const props = defineProps<{
  requests: RequestListItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  loading?: boolean;
  canApproveReject?: (request: RequestListItem) => boolean;
  canCancel?: (request: RequestListItem) => boolean;
  canEdit?: (request: RequestListItem) => boolean;
  canAddMore?: (request: RequestListItem) => boolean;
  canReopen?: (request: RequestListItem) => boolean;
  canCheckout?: (request: RequestListItem) => boolean;
  /** Shown when there are no rows (e.g. branch setup or filters). */
  emptyMessage?: string;
}>();

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
</script>

<template>
  <TableShell :class="[REQUEST_LIST_PANEL_CLASS, 'overflow-visible']">
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
      body-class="!max-h-none !overflow-visible"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="request in requests"
        :key="request.id"
        :data-testid="`request-row-${request.id}`"
        class="cursor-pointer transition-colors duration-150 hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
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
        v-if="requests.length === 0"
        class="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-grey-300"
      >
        {{ emptyMessage ?? 'No requests found for the current filters.' }}
      </div>
    </TableBody>

    <TableFooter v-if="!loading && (requests.length > 0 || totalItems > 0)">
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        :disabled="loading"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
