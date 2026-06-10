<script setup lang="ts">
import type { WalletRecord } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@gosource/ui';
import { Copy } from 'lucide-vue-next';
import {
  canCopyWalletAccountNumber,
  formatWalletAccountDisplay,
} from '~/lib/wallet-display';
import { formatRequestCurrency } from '~/lib/request-details';

const props = defineProps<{
  open: boolean;
  wallet: WalletRecord | null;
  amount: number;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  done: [];
}>();

const canCopy = computed(() => canCopyWalletAccountNumber(props.wallet));

const bankName = computed(() => formatWalletAccountDisplay(props.wallet?.bankName));
const accountNumber = computed(() => formatWalletAccountDisplay(props.wallet?.accountNumber));
const accountName = computed(() => formatWalletAccountDisplay(props.wallet?.accountName));

function close() {
  emit('update:open', false);
}

async function copyText(value: string) {
  if (!import.meta.client || !value || !canCopy.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Unable to copy right now');
  }
}

function onDone() {
  emit('done');
  close();
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Bank transfer
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Transfer {{ formatRequestCurrency(amount) }} to your wallet account below. Your balance
            updates when the transfer is confirmed.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0 cursor-pointer" />
      </DialogHeader>

      <DialogBody class="space-y-4">
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">Bank name</p>
          <p class="mt-2 font-medium text-grey-900">{{ bankName }}</p>
        </div>
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Account number
          </p>
          <div class="mt-2 flex items-center gap-2">
            <p class="font-medium text-grey-900">{{ accountNumber }}</p>
            <button
              v-if="canCopy"
              type="button"
              class="cursor-pointer text-grey-300 hover:text-grey-900"
              aria-label="Copy account number"
              @click="copyText(accountNumber)"
            >
              <Copy class="size-4" />
            </button>
          </div>
        </div>
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Account name
          </p>
          <p class="mt-2 font-medium text-grey-900">{{ accountName }}</p>
        </div>
      </DialogBody>

      <DialogFooter class="gap-2">
        <Button variant="neutral" size="small" class="!w-auto" @click="close">
          Close
        </Button>
        <Button size="small" class="!w-auto" @click="onDone">
          I have made the transfer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
