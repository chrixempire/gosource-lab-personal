<script setup lang="ts">
import { Button, Input } from '@gosource/ui';
import { Minus, Plus, Trash2 } from 'lucide-vue-next';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { blockExtraDecimal, PRODUCT_ITEM_INPUT_CLASS } from '~/lib/product-form';
import type { PurchaseOrderLineItem } from '~/types/purchase-orders';

const lineItems = defineModel<PurchaseOrderLineItem[]>('lineItems', { required: true });

defineProps<{
  formatEditableNumber: (value: number | string | null | undefined) => string;
}>();

function parseFormattedNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function updateQuantity(index: number, value: string) {
  const item = lineItems.value[index];
  if (!item) return;

  // Quantity accepts decimals (e.g. 1.5); keep a minimum of 1.
  const quantity = Math.max(1, parseFormattedNumber(value) || 1);
  item.quantity = quantity;
  item.totalPrice = quantity * item.unitPrice;
}

function updateUnitPrice(index: number, value: string) {
  const item = lineItems.value[index];
  if (!item) return;

  const unitPrice = Math.max(0, parseFormattedNumber(value));
  item.unitPrice = unitPrice;
  item.totalPrice = unitPrice * item.quantity;
}

function stepQuantity(index: number, delta: number) {
  const item = lineItems.value[index];
  if (!item) return;

  const quantity = Math.max(1, item.quantity + delta);
  item.quantity = quantity;
  item.totalPrice = quantity * item.unitPrice;
}

function removeLine(index: number) {
  lineItems.value = lineItems.value.filter((_, itemIndex) => itemIndex !== index);
}
</script>

<template>
  <div v-if="lineItems.length === 0" class="rounded-2xl border border-dashed border-grey-50 bg-grey-55/40 px-4 py-10 text-center">
    <p class="text-sm font-medium text-grey-700">No items yet</p>
    <p class="mt-1 text-xs text-grey-500">Search and add products to build this purchase order.</p>
  </div>

  <div v-else class="grid gap-3">
    <article
      v-for="(item, index) in lineItems"
      :key="item.productId"
      class="rounded-2xl border border-grey-50 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(16,24,40,0.14)]"
    >
      <div class="flex items-start gap-3">
        <div
          v-if="item.imageUrl"
          class="size-12 shrink-0 overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
        >
          <img :src="item.imageUrl" :alt="item.name" class="size-full object-cover" />
        </div>
        <div
          v-else
          class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-300"
        >
          {{ item.name.slice(0, 1).toUpperCase() }}
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-grey-900">{{ item.name }}</p>
          <p class="mt-0.5 truncate text-xs text-grey-500">{{ item.categoryLabel }}</p>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          class="!size-9 shrink-0 text-negative-500 hover:!bg-negative-50 hover:!text-negative-600"
          aria-label="Remove item"
          @click="removeLine(index)"
        >
          <Trash2 class="size-4" />
        </Button>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-xs font-medium uppercase tracking-wide text-grey-400">Unit price</span>
          <Input
            :model-value="formatEditableNumber(item.unitPrice)"
            inputmode="decimal"
            :class="PRODUCT_ITEM_INPUT_CLASS"
            @update:model-value="updateUnitPrice(index, $event)"
          />
        </label>

        <div class="grid gap-1.5">
          <span class="text-xs font-medium uppercase tracking-wide text-grey-400">Quantity</span>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              class="!size-10 shrink-0"
              aria-label="Decrease quantity"
              :disabled="item.quantity <= 1"
              @click="stepQuantity(index, -1)"
            >
              <Minus class="size-4" />
            </Button>
            <Input
              :model-value="String(item.quantity)"
              inputmode="decimal"
              class="text-center"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              @keypress="blockExtraDecimal"
              @update:model-value="updateQuantity(index, $event)"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              class="!size-10 shrink-0"
              aria-label="Increase quantity"
              @click="stepQuantity(index, 1)"
            >
              <Plus class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl bg-primary-50/50 px-3 py-2.5">
        <span class="text-xs font-semibold uppercase tracking-wide text-grey-500">Line total</span>
        <span class="text-base font-semibold text-grey-900">
          {{ formatDashboardCurrency(item.totalPrice) }}
        </span>
      </div>
    </article>
  </div>
</template>
