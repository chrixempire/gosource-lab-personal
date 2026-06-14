<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft, Eye } from 'lucide-vue-next';
import OrderDetailMoreActionsMenu from '~/components/orders/OrderDetailMoreActionsMenu.vue';
import type { AdminOrderDetailsView } from '~/lib/order-details';
import type { OrderStatus } from '~/types/orders';

defineProps<{
  view: AdminOrderDetailsView | null;
  loading?: boolean;
  previewLoading?: boolean;
  invoiceLoading?: boolean;
  canCancel?: boolean;
  canChangeStatus?: boolean;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  previewInvoice: [];
  downloadInvoice: [];
  changeStatus: [status: OrderStatus];
  cancel: [];
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-4">
    <div
      v-if="loading || !view"
      class="flex flex-wrap items-center justify-between gap-3"
      aria-busy="true"
      aria-label="Loading order header"
    >
      <div class="h-8 w-36 animate-pulse rounded-[12px] bg-grey-55" />
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div class="h-8 w-32 animate-pulse rounded-[12px] bg-grey-55" />
        <div class="h-8 w-32 animate-pulse rounded-[12px] bg-grey-55" />
      </div>
    </div>

    <div
      v-else
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="emit('back')"
      >
        Back to orders
      </Button>

      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit shrink-0"
          :left-icon="Eye"
          :loading="previewLoading"
          @click="emit('previewInvoice')"
        >
          Preview invoice
        </Button>
        <OrderDetailMoreActionsMenu
          :can-cancel="canCancel"
          :can-change-status="canChangeStatus"
          :disabled="actionsDisabled"
          :invoice-loading="invoiceLoading"
          @download-invoice="emit('downloadInvoice')"
          @change-status="emit('changeStatus', $event)"
          @cancel="emit('cancel')"
        />
      </div>
    </div>

    <div v-if="loading || !view" class="min-w-0">
      <div class="h-3 w-24 animate-pulse rounded bg-grey-55" />
      <div class="mt-2 flex items-center gap-2">
        <div class="h-8 w-56 animate-pulse rounded bg-grey-55" />
        <div class="h-7 w-24 animate-pulse rounded-full bg-grey-55" />
      </div>
    </div>

    <div v-else class="min-w-0">
      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
        Order reference
      </p>
      <div class="mt-1 flex flex-wrap items-center gap-2">
        <h1 class="text-h6 lg:text-h4">
          {{ view.referenceLabel }}
        </h1>
        <StatusTag
          :variant="view.statusVariant"
          size="medium"
          class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ view.statusLabel }}
        </StatusTag>
      </div>
    </div>
  </header>
</template>
