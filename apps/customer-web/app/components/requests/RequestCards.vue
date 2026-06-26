<script setup lang="ts">
import { Avatar, Button, StatusTag } from '@gosource/ui';

import type { RequestRecord } from '@gosource/api-client';
import RequestActionsMenu from '~/components/requests/RequestActionsMenu.vue';

export type RequestListItem = {
  id: string;
  branchId: string;
  reference: string;
  initiatorName: string;
  initiatorEmail: string;
  branchName: string;
  status: RequestRecord['status'];
  initiatorAccountId: string;
  statusLabel: string;
  statusVariant: 'success' | 'negative' | 'warning';
  paymentLabel: string;
  createdLabel: string;
  amountLabel: string;
  itemsCountLabel: string;
  initials: string;
};

defineProps<{
  requests: RequestListItem[];
  canApproveReject?: (request: RequestListItem) => boolean;
  canCancel?: (request: RequestListItem) => boolean;
  canEdit?: (request: RequestListItem) => boolean;
  canAddMore?: (request: RequestListItem) => boolean;
  canReopen?: (request: RequestListItem) => boolean;
  canCheckout?: (request: RequestListItem) => boolean;
}>();

const emit = defineEmits<{
  click: [request: RequestListItem];
  viewDetails: [request: RequestListItem];
  edit: [request: RequestListItem];
  addMore: [request: RequestListItem];
  reopen: [request: RequestListItem];
  checkout: [request: RequestListItem];
  approve: [request: RequestListItem];
  reject: [request: RequestListItem];
  cancel: [request: RequestListItem];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <article
      v-for="request in requests"
      :key="request.id"
      class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] cursor-pointer rounded-[24px] border border-grey-50 bg-background-on-canvas p-3 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] transition-colors duration-150 hover:bg-primary-50/30 sm:p-5"
      @click="emit('click', request)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <Avatar
            size="md"
            class="shrink-0"
            :alt="request.initiatorName"
            :fallback="request.initials"
            fallback-class="bg-button-primary"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <h2 class="break-words text-base font-semibold leading-snug text-grey-900">
              {{ request.reference }}
            </h2>
            <p class="break-words text-sm text-grey-900">
              {{ request.initiatorName }}
            </p>
            <p class="break-words text-sm text-grey-300">
              {{ request.branchName }}
            </p>
          </div>
        </div>

        <RequestActionsMenu
          class="shrink-0"
          :can-approve-reject="canApproveReject?.(request)"
          :can-cancel="canCancel?.(request)"
          :can-edit="canEdit?.(request)"
          :can-add-more="canAddMore?.(request)"
          :can-reopen="canReopen?.(request)"
          :show-approve-action="!canCheckout?.(request)"
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
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <Button
          v-if="canCheckout?.(request)"
          variant="primary"
          size="small"
          class="!w-auto whitespace-nowrap"
          @click.stop="emit('checkout', request)"
        >
          Checkout
        </Button>
        <StatusTag
          :variant="request.statusVariant"
          size="medium"
          class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ request.statusLabel }}
        </StatusTag>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Items
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ request.itemsCountLabel }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Payment
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ request.paymentLabel }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Created
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ request.createdLabel }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Total
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ request.amountLabel }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
