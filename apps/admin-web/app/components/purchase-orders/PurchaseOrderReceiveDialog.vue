<script setup lang="ts">
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@gosource/ui';
import type { PurchaseOrderReceiveRow } from '~/types/purchase-orders';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  rows: PurchaseOrderReceiveRow[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [items: { productId: string; quantityReceived: number }[]];
}>();

const RECEIVE_GRID_TEMPLATE = 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)';

const localRows = ref<PurchaseOrderReceiveRow[]>([]);
const markAll = ref(false);

watch(
  () => props.rows,
  (rows) => {
    localRows.value = rows.map((row) => ({ ...row, toReceive: '', error: '' }));
    markAll.value = false;
  },
  { immediate: true, deep: true },
);

function remainingToReceive(row: PurchaseOrderReceiveRow) {
  return Math.max(0, row.ordered - row.received);
}

function truncateProductId(productId: string) {
  if (productId.length <= 18) {
    return productId;
  }

  return `${productId.slice(0, 18)}…`;
}

function validateRow(row: PurchaseOrderReceiveRow) {
  const max = remainingToReceive(row);
  const value = Number(row.toReceive);

  if (row.toReceive === '' || Number.isNaN(value) || value < 0) {
    row.error = 'Enter a valid quantity';
    return false;
  }

  if (value > max) {
    row.error = max === 0 ? 'Nothing left to receive' : `Cannot receive more than ${max}`;
    return false;
  }

  row.error = '';
  return true;
}

function validateRowOnInput(row: PurchaseOrderReceiveRow) {
  if (row.toReceive === '') {
    row.error = '';
    syncMarkAllState();
    return;
  }

  const value = Number(row.toReceive);
  const max = remainingToReceive(row);

  if (Number.isNaN(value) || value < 0) {
    row.error = 'Enter a valid quantity';
    syncMarkAllState();
    return;
  }

  if (value > row.ordered) {
    row.error = `Cannot receive more than ${row.ordered}`;
    syncMarkAllState();
    return;
  }

  if (value > max) {
    row.error = max === 0 ? 'Nothing left to receive' : `Cannot receive more than ${max}`;
    syncMarkAllState();
    return;
  }

  row.error = '';
  syncMarkAllState();
}

function syncMarkAllState() {
  const rowsWithRemaining = localRows.value.filter((row) => remainingToReceive(row) > 0);
  if (rowsWithRemaining.length === 0) {
    markAll.value = false;
    return;
  }

  markAll.value = rowsWithRemaining.every((row) => {
    const remaining = remainingToReceive(row);
    return row.toReceive !== '' && Number(row.toReceive) === remaining;
  });
}

function onMarkAllChange(checked: boolean | 'indeterminate') {
  if (checked !== true) {
    markAll.value = false;
    for (const row of localRows.value) {
      row.toReceive = '';
      row.error = '';
    }
    return;
  }

  markAll.value = true;
  for (const row of localRows.value) {
    const remaining = remainingToReceive(row);
    row.toReceive = remaining > 0 ? String(remaining) : '';
    row.error = '';
  }
}

function onToReceiveInput(row: PurchaseOrderReceiveRow) {
  validateRowOnInput(row);
}

const canConfirm = computed(() =>
  localRows.value.some((row) => Number(row.toReceive) > 0 && !row.error),
);

function onConfirm() {
  let valid = true;
  const items: { productId: string; quantityReceived: number }[] = [];

  for (const row of localRows.value) {
    if (!row.toReceive || Number(row.toReceive) <= 0) {
      continue;
    }

    if (!validateRow(row)) {
      valid = false;
      continue;
    }

    items.push({
      productId: row.productId,
      quantityReceived: Number(row.toReceive),
    });
  }

  if (!valid || items.length === 0) {
    return;
  }

  emit('confirm', items);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,600px)]">
      <DialogHeader class="!px-4 !py-3 sm:!px-4 sm:!pb-2 sm:!pt-3">
        <DialogTitle>Receive items</DialogTitle>
        <DialogClose class="shrink-0" :disabled="loading" />
      </DialogHeader>

      <DialogBody class="!p-0">
        <div
          class="grid items-center gap-x-3 border-b border-grey-50 px-4 py-2 text-sm font-medium text-grey-700"
          :style="{ gridTemplateColumns: RECEIVE_GRID_TEMPLATE }"
        >
          <span>Items</span>
          <span class="text-center">Ordered</span>
          <span class="text-center">Received</span>
          <span>To receive</span>
        </div>

        <div class="max-h-[50vh] overflow-y-auto px-4">
          <div
            v-for="row in localRows"
            :key="row.productId"
            class="grid items-center gap-x-3 border-b border-grey-50 py-3 last:border-b-0"
            :style="{ gridTemplateColumns: RECEIVE_GRID_TEMPLATE }"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-grey-900">{{ row.name }}</p>
              <p class="mt-0.5 truncate font-mono text-xs text-grey-500">
                {{ truncateProductId(row.productId) }}
              </p>
            </div>

            <p class="text-center text-sm font-medium text-grey-900">{{ row.ordered }}</p>
            <p class="text-center text-sm font-medium text-grey-900">{{ row.received }}</p>

            <div class="min-w-0">
              <Input
                v-model="row.toReceive"
                type="text"
                inputmode="numeric"
                min="0"
                :max="remainingToReceive(row)"
                :invalid="Boolean(row.error)"
                :aria-label="`Quantity to receive for ${row.name}`"
                class="!h-9 [-moz-appearance:textfield] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                @input="onToReceiveInput(row)"
                @blur="validateRow(row)"
              />
              <p v-if="row.error" class="mt-1 text-xs text-negative-500">{{ row.error }}</p>
            </div>
          </div>
        </div>
      </DialogBody>

      <DialogFooter
        class="!flex-row !flex-nowrap !items-center !justify-between gap-3 !px-4 !py-3 [&>*]:!flex-none"
      >
        <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-grey-900">
          <Checkbox :model-value="markAll" @update:model-value="onMarkAllChange" />
          Mark all as received
        </label>
        <div class="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="medium"
            class="!w-auto min-w-[6rem]"
            :disabled="loading"
            @click="open = false"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="medium"
            class="!w-auto min-w-[6rem]"
            :loading="loading"
            :disabled="!canConfirm"
            @click="onConfirm"
          >
            Confirm
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
