<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Input } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-vue-next';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';

// Dedicated quantity strip for the Explore (Sprout) cards — independent of the
// market `MarketProductQtyStrip` so its styling can be tweaked freely.

const QTY_INPUT_DEBOUNCE_MS = 450;

const props = withDefaults(
  defineProps<{
    productId: string;
    unit: string;
    product?: MarketProduct;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const {
  getQtyForUnit,
  setQuantityForUnit,
  increment,
  decrement,
  remove,
  getLineMutationPending,
} = useMarketplaceCart();

const cartOptions = computed(() => (props.product ? { product: props.product } : undefined));

const qty = computed(() => getQtyForUnit(props.productId, props.unit));

const draftQty = ref(String(Math.max(1, qty.value || 1)));
const isQtyInputFocused = ref(false);

function parseDraftQuantity(): number | null {
  const trimmed = draftQty.value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function syncDraftFromQty() {
  if (isQtyInputFocused.value) return;
  draftQty.value = String(Math.max(1, qty.value || 1));
}

watch(qty, () => syncDraftFromQty(), { immediate: true });
watch(() => props.unit, () => syncDraftFromQty());

async function commitQuantity(parsed: number) {
  if (parsed === qty.value) {
    draftQty.value = String(parsed);
    return;
  }
  await setQuantityForUnit(props.productId, props.unit, parsed, cartOptions.value);
}

async function commitDraft() {
  const parsed = parseDraftQuantity();
  if (parsed === null || parsed < 1) return;
  await commitQuantity(parsed);
}

const debouncedCommitDraft = useDebounceFn(commitDraft, QTY_INPUT_DEBOUNCE_MS);
function cancelDebouncedCommit() {
  (debouncedCommitDraft as typeof debouncedCommitDraft & { cancel?: () => void }).cancel?.();
}

const skipNextBlurCommit = ref(false);

function onDraftQtyUpdate(value: string) {
  draftQty.value = value.replace(/[^\d]/g, '');
  if (props.disabled) return;
  const parsed = parseDraftQuantity();
  if (parsed === null || parsed < 1) {
    cancelDebouncedCommit();
    return;
  }
  debouncedCommitDraft();
}

function onQtyFocus() {
  isQtyInputFocused.value = true;
}

async function normalizeDraftOnLeave() {
  cancelDebouncedCommit();
  const parsed = parseDraftQuantity();
  const next = parsed === null || parsed < 1 ? Math.max(1, qty.value || 1) : parsed;
  draftQty.value = String(next);
  await commitQuantity(next);
}

async function onQtyBlur() {
  if (props.disabled) return;
  isQtyInputFocused.value = false;
  if (skipNextBlurCommit.value) {
    skipNextBlurCommit.value = false;
    return;
  }
  await normalizeDraftOnLeave();
}

async function onQtyEnter(e: KeyboardEvent) {
  if (props.disabled) return;
  isQtyInputFocused.value = false;
  await normalizeDraftOnLeave();
  skipNextBlurCommit.value = true;
  (e.target as HTMLInputElement | null)?.blur();
}

async function onMinusOrTrash() {
  if (props.disabled) return;
  if (qty.value <= 1) {
    await remove(props.productId, props.unit);
    draftQty.value = '1';
    return;
  }
  await decrement(props.productId, props.unit, cartOptions.value);
}

async function onPlus() {
  if (props.disabled) return;
  await increment(props.productId, props.unit, cartOptions.value);
}

const pendingDirection = computed(() =>
  getLineMutationPending(props.productId, props.unit),
);
const plusLoading = computed(() => pendingDirection.value === 'increase');
const minusLoading = computed(() => pendingDirection.value === 'decrease');
const controlsBusy = computed(() => pendingDirection.value !== null);
const showTrashOnMinus = computed(() => qty.value <= 1);
</script>

<template>
  <!-- Compact 32px-tall strip; tighter padding on the +/- buttons. -->
  <div
    class="inline-flex h-8 min-h-8 w-fit items-center overflow-hidden rounded-full bg-button-primary p-0.5"
    :class="disabled && 'pointer-events-none opacity-60'"
    @click.stop
  >
    <button
      type="button"
      class="flex h-full shrink-0 items-center justify-center rounded-l-full px-1.5 text-white transition-colors enabled:cursor-pointer enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled || controlsBusy"
      :aria-label="showTrashOnMinus ? 'Remove item' : 'Decrease quantity'"
      @click="onMinusOrTrash"
    >
      <Loader2 v-if="minusLoading" class="size-3.5 animate-spin text-white" />
      <Trash2 v-else-if="showTrashOnMinus" class="size-3.5" />
      <Minus v-else class="size-3.5" :stroke-width="2.75" />
    </button>

    <div class="flex h-full w-[80px] shrink-0 items-center justify-center">
      <Input
        :model-value="draftQty"
        type="text"
        inputmode="numeric"
        maxlength="3"
        :disabled="disabled || controlsBusy"
        class="!h-6 !min-h-0 !w-[50px] !rounded-md !border-2 !border-white !bg-white !px-0.5 !py-0 !text-center !text-[13px] !font-semibold !tabular-nums !text-[#04550B] !shadow-none focus:!border-white focus:!ring-2 focus:!ring-white/80 disabled:!bg-white disabled:!opacity-100"
        aria-label="Quantity"
        @update:model-value="onDraftQtyUpdate"
        @focus="onQtyFocus"
        @blur="onQtyBlur"
        @keydown.enter.prevent="onQtyEnter"
      />
    </div>

    <button
      type="button"
      class="flex h-full shrink-0 items-center justify-center rounded-r-full px-1.5 text-white transition-colors enabled:cursor-pointer enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="disabled || controlsBusy"
      aria-label="Increase quantity"
      @click="onPlus"
    >
      <Loader2 v-if="plusLoading" class="size-3.5 animate-spin text-white" />
      <Plus v-else class="size-3.5" :stroke-width="2.75" />
    </button>
  </div>
</template>
