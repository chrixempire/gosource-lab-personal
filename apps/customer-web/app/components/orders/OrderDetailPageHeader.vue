<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft, Download } from 'lucide-vue-next';
import type { OrderDetailsView } from '~/lib/order-details';

defineProps<{
  view: OrderDetailsView | null;
  loading?: boolean;
  reorderLoading?: boolean;
  downloadInvoiceLoading?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  downloadInvoice: [];
  reorder: [];
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-4">
    <div class="w-fit self-start">
      <Button
        type="button"
        variant="neutral"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="emit('back')"
      >
        Back to orders
      </Button>
    </div>

    <div
      v-if="loading || !view"
      class="animate-pulse"
      aria-busy="true"
      aria-label="Loading order header"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0 space-y-2">
          <div class="flex items-center gap-2">
            <div class="h-4 w-28 rounded bg-grey-50" />
            <div class="h-6 w-20 rounded-full bg-grey-50" />
          </div>
          <div class="h-8 w-56 max-w-full rounded bg-grey-50" />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="h-8 w-36 rounded-[10px] bg-grey-50" />
          <div class="h-8 w-24 rounded-[10px] bg-grey-50" />
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Order reference
          </span>
          <StatusTag
            :variant="view.statusVariant"
            size="medium"
            class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ view.statusLabel }}
          </StatusTag>
        </div>
        <h1 class="mt-1 text-h5 lg:text-h3">
          {{ view.reference }}
        </h1>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit shrink-0"
          :left-icon="Download"
          :loading="downloadInvoiceLoading"
          :disabled="downloadInvoiceLoading"
          @click="emit('downloadInvoice')"
        >
          Download invoice
        </Button>
        <Button
          type="button"
          variant="primary"
          size="small"
          class="!w-fit shrink-0"
          :loading="reorderLoading"
          :disabled="reorderLoading"
          @click="emit('reorder')"
        >
          Reorder
        </Button>
      </div>
    </div>
  </header>
</template>
