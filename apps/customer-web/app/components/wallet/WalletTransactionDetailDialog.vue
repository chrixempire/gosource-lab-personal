<script setup lang="ts">
import type { WalletTransactionRecord } from '@gosource/api-client';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  StatusTag,
  toast,
} from '@gosource/ui';
import { Copy } from 'lucide-vue-next';
import {
  formatWalletTransactionAmount,
  formatWalletTransactionDateTime,
  walletTransactionStatusVariant,
  walletTransactionTypeIndicatorClass,
} from '~/lib/wallet-transaction-display';

defineProps<{
  open: boolean;
  transaction: WalletTransactionRecord | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

async function copyText(value: string) {
  if (!import.meta.client || !value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Unable to copy right now');
  }
}
</script>

<template>
  <Dialog :open="open && Boolean(transaction)" @update:open="emit('update:open', $event)">
    <DialogContent v-if="transaction" class="max-w-md">
      <DialogHeader>
        <DialogTitle>Transaction details</DialogTitle>
        <DialogClose />
      </DialogHeader>
      <DialogBody class="space-y-6">
        <div>
          <p class="text-sm font-medium text-grey-900">Reference number</p>
          <div class="mt-1 flex items-center gap-2">
            <p class="text-sm text-grey-300">{{ transaction.reference }}</p>
            <button
              type="button"
              class="cursor-pointer text-grey-300 hover:text-grey-900"
              aria-label="Copy reference number"
              @click="copyText(transaction.reference)"
            >
              <Copy class="size-4" />
            </button>
          </div>
        </div>

        <div v-if="transaction.paymentReference">
          <p class="text-sm font-medium text-grey-900">Payment reference</p>
          <div class="mt-1 flex items-center gap-2">
            <p class="text-sm text-grey-300">{{ transaction.paymentReference }}</p>
            <button
              type="button"
              class="cursor-pointer text-grey-300 hover:text-grey-900"
              aria-label="Copy payment reference"
              @click="copyText(transaction.paymentReference)"
            >
              <Copy class="size-4" />
            </button>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-grey-900">Title</p>
          <p class="mt-1 text-sm text-grey-300">{{ transaction.description }}</p>
        </div>

        <div>
          <p class="text-sm font-medium text-grey-900">Amount</p>
          <p class="mt-1 text-sm text-grey-300">
            {{ formatWalletTransactionAmount(transaction) }}
          </p>
        </div>

        <div>
          <p class="text-sm font-medium text-grey-900">Date</p>
          <p class="mt-1 text-sm text-grey-300">
            {{ formatWalletTransactionDateTime(transaction.createdAt) }}
          </p>
        </div>

        <div>
          <p class="text-sm font-medium text-grey-900">Type</p>
          <div class="mt-1 flex items-center gap-2 capitalize">
            <span
              class="size-2 shrink-0 rounded-full"
              :class="walletTransactionTypeIndicatorClass(transaction.type)"
              aria-hidden="true"
            />
            <span class="text-sm text-grey-300">{{ transaction.type }}</span>
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-grey-900">Status</p>
          <StatusTag
            class="mt-2 capitalize"
            :variant="walletTransactionStatusVariant(transaction.status)"
            size="medium"
          >
            {{ transaction.status }}
          </StatusTag>
        </div>
      </DialogBody>
    </DialogContent>
  </Dialog>
</template>
