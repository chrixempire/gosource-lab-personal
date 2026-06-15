<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Input } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-vue-next';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';

/** Commit typed quantity after pause in typing (avoids one API call per digit). */
const QTY_INPUT_DEBOUNCE_MS = 450;

const props = withDefaults(
  defineProps<{
    /** Cart / catalog mode — required unless `modelValue` is set (controlled / request lines). */
    productId?: string;
    /** Unit label matching cart line keys (see `effectiveUnitChoices`). */
    unit?: string;
    /** Product payload for guest cart when not in catalog cache. */
    product?: MarketProduct;
    /** `modal`: taller strip. `cart`: compact strip for cart drawer and request lines. `detail`: grey picker on product detail / modal. */
    variant?: 'card' | 'modal' | 'cart' | 'detail' | 'explore';
    /** Controlled quantity (request edit, etc.). */
    modelValue?: number;
    disabled?: boolean;
    /** When true, minus at qty 1 shows trash and emits `remove` instead of blocking. */
    allowRemoveAtMin?: boolean;
  }>(),
  {
    variant: 'card',
    disabled: false,
    allowRemoveAtMin: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [quantity: number];
  remove: [];
}>();

const isControlled = computed(() => props.modelValue !== undefined);

const { getQtyForUnit, setQuantityForUnit, increment, decrement, remove, getLineMutationPending } =
  useMarketplaceCart();

const cartOptions = computed(() => (props.product ? { product: props.product } : undefined));

const qty = computed(() => {
  if (isControlled.value) {
    return Math.max(1, props.modelValue ?? 1);
  }

  if (!props.productId || !props.unit) {
    return 1;
  }

  return getQtyForUnit(props.productId, props.unit);
});

const draftQty = ref(String(Math.max(1, qty.value || 1)));
const isQtyInputFocused = ref(false);

function parseDraftQuantity(): number | null {
  const trimmed = draftQty.value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function syncDraftFromQty() {
  if (isQtyInputFocused.value) {
    return;
  }

  draftQty.value = String(Math.max(1, qty.value || 1));
}

watch(qty, () => {
  syncDraftFromQty();
}, { immediate: true });

watch(
  () => props.unit,
  () => {
    syncDraftFromQty();
  },
);

async function commitControlled(parsed: number) {
  if (parsed === qty.value) {
    draftQty.value = String(parsed);
    return;
  }

  emit('update:modelValue', parsed);
}

async function commitQuantity(parsed: number) {
  if (isControlled.value) {
    await commitControlled(parsed);
    return;
  }

  if (parsed === qty.value) {
    draftQty.value = String(parsed);
    return;
  }

  if (!props.productId || !props.unit) {
    return;
  }

  await setQuantityForUnit(props.productId, props.unit, parsed, cartOptions.value);
}

async function commitDraft() {
  const parsed = parseDraftQuantity();
  if (parsed === null || parsed < 1) {
    return;
  }

  await commitQuantity(parsed);
}

/** Empty or invalid blur restores the last committed qty (cart / request line), else 1. */
function resolveInvalidDraftQuantity() {
  const committed = qty.value;
  return committed > 0 ? committed : 1;
}

async function normalizeDraftOnLeave() {
  cancelDebouncedCommit();

  const parsed = parseDraftQuantity();
  if (parsed === null || parsed < 1) {
    const fallback = resolveInvalidDraftQuantity();
    draftQty.value = String(fallback);
    await commitQuantity(fallback);
    return;
  }

  draftQty.value = String(parsed);
  await commitQuantity(parsed);
}

const debouncedCommitDraft = useDebounceFn(commitDraft, QTY_INPUT_DEBOUNCE_MS);

function cancelDebouncedCommit() {
  (
    debouncedCommitDraft as typeof debouncedCommitDraft & {
      cancel?: () => void;
    }
  ).cancel?.();
}

const skipNextBlurCommit = ref(false);

function onQtyInput() {
  if (props.disabled) {
    return;
  }

  const parsed = parseDraftQuantity();
  if (parsed === null || parsed < 1) {
    cancelDebouncedCommit();
    return;
  }

  debouncedCommitDraft();
}

function onDraftQtyUpdate(value: string) {
  draftQty.value = value.replace(/[^\d]/g, '');
  onQtyInput();
}

function onQtyFocus() {
  isQtyInputFocused.value = true;
}

async function onQtyBlur() {
  if (props.disabled) {
    return;
  }

  isQtyInputFocused.value = false;

  if (skipNextBlurCommit.value) {
    skipNextBlurCommit.value = false;
    return;
  }

  await normalizeDraftOnLeave();
}

async function onQtyEnter(e: KeyboardEvent) {
  if (props.disabled) {
    return;
  }

  isQtyInputFocused.value = false;
  await normalizeDraftOnLeave();
  skipNextBlurCommit.value = true;
  (e.target as HTMLInputElement | null)?.blur();
}

async function onMinusOrTrash() {
  if (props.disabled) {
    return;
  }

  if (isControlled.value) {
    if (qty.value <= 1) {
      if (props.allowRemoveAtMin) {
        emit('remove');
      }
      return;
    }
    emit('update:modelValue', qty.value - 1);
    return;
  }

  if (!props.productId || !props.unit) {
    return;
  }

  if (qty.value <= 1) {
    await remove(props.productId, props.unit);
    draftQty.value = '1';
    return;
  }
  await decrement(props.productId, props.unit, cartOptions.value);
}

async function onPlus() {
  if (props.disabled) {
    return;
  }

  if (isControlled.value) {
    emit('update:modelValue', qty.value + 1);
    return;
  }

  if (!props.productId || !props.unit) {
    return;
  }

  await increment(props.productId, props.unit, cartOptions.value);
}

const isModal = computed(() => props.variant === 'modal');
const isCart = computed(() => props.variant === 'cart');
const isDetail = computed(() => props.variant === 'detail');
const isExplore = computed(() => props.variant === 'explore');

const pendingDirection = computed(() => {
  if (isControlled.value || !props.productId || !props.unit) {
    return null;
  }

  return getLineMutationPending(props.productId, props.unit);
});

const plusLoading = computed(() => pendingDirection.value === 'increase');
const minusLoading = computed(() => pendingDirection.value === 'decrease');
const controlsBusy = computed(() => pendingDirection.value !== null);

const showTrashOnMinus = computed(() => {
  if (qty.value > 1) {
    return false;
  }

  if (isControlled.value && !isDetail.value) {
    return props.allowRemoveAtMin;
  }

  return true;
});

const minusDisabled = computed(
  () =>
    props.disabled ||
    controlsBusy.value ||
    (isControlled.value && qty.value <= 1 && !props.allowRemoveAtMin),
);

const plusDisabled = computed(() => props.disabled || controlsBusy.value);

const stripShellClass = computed(() => {
  if (isDetail.value) {
    return 'h-12 min-h-12 w-[12rem] shrink-0 overflow-hidden rounded-full bg-grey-50';
  }

  if (isExplore.value) {
    return 'h-9 min-h-9 w-full overflow-hidden rounded-full bg-button-primary p-0.5 shadow-sm';
  }

  if (isModal.value) {
    return 'h-12 min-h-12 overflow-hidden rounded-full bg-button-primary p-0.5 shadow-md';
  }

  if (isCart.value) {
    return 'h-7 min-h-7 w-full max-w-[7.5rem] overflow-hidden rounded-full bg-button-primary p-0.5 shadow-md';
  }

  return 'h-9 min-h-9 overflow-hidden rounded-full bg-button-primary p-0.5 shadow-md';
});

const stripLayoutClass = computed(() => (isDetail.value ? 'items-stretch' : 'items-center'));

const minusBtnClass = computed(() => {
  if (isDetail.value) {
    return [
      'flex min-h-0 min-w-0 basis-[35%] flex-shrink-0 flex-grow-0 items-center justify-center rounded-l-full rounded-r-none text-grey-700 transition-colors disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:bg-background-active',
      minusDisabled.value ? 'opacity-50' : '',
    ];
  }

  const basis = isCart.value ? 'basis-[35%] min-w-0' : 'min-w-0 basis-[35%]';

  return [
    `flex min-h-0 flex-shrink-0 flex-grow-0 items-center justify-center self-stretch rounded-l-full rounded-r-none ${basis}`,
    'text-white transition-colors enabled:cursor-pointer enabled:hover:bg-white/15',
    minusDisabled.value ? 'cursor-not-allowed opacity-50' : '',
  ];
});

const plusBtnClass = computed(() => {
  if (isDetail.value) {
    return [
      'flex min-h-0 min-w-0 basis-[35%] flex-shrink-0 flex-grow-0 items-center justify-center rounded-r-full rounded-l-none text-grey-700 transition-colors disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:bg-background-active',
      props.disabled ? 'opacity-50' : '',
    ];
  }

  const basis = isCart.value ? 'basis-[35%] min-w-0' : 'min-w-0 basis-[35%]';

  return [
    `flex min-h-0 flex-shrink-0 flex-grow-0 items-center justify-center self-stretch rounded-r-full rounded-l-none ${basis}`,
    'text-white transition-colors enabled:cursor-pointer enabled:hover:bg-white/15',
    props.disabled ? 'cursor-not-allowed opacity-50' : '',
  ];
});

const centerShellClass = computed(() => {
  if (isDetail.value) {
    return 'flex min-h-0 min-w-0 basis-[30%] flex-shrink-0 flex-grow-0 items-stretch self-stretch p-0';
  }

  return 'flex min-h-0 min-w-0 basis-[30%] flex-shrink-0 flex-grow-0 items-center justify-center p-0';
});

const stripInputClass = computed(() => {
  const base =
    '!min-h-0 !w-full !px-1 !py-0 !text-center !font-semibold !tabular-nums !shadow-none disabled:!opacity-100';

  if (isDetail.value) {
    return `${base} !h-full !rounded-md !border !border-grey-50 !bg-background-on-canvas !text-[16px] !text-grey-900 focus:!border-border-input-active disabled:!bg-background-on-canvas`;
  }

  const size = isExplore.value
    ? '!text-[13px]'
    : isModal.value
      ? '!text-base'
      : isCart.value
        ? '!text-[12px]'
        : '!text-[14px]';
  const height = isExplore.value ? '!h-7' : isModal.value ? '!h-11' : isCart.value ? '!h-6' : '!h-8';

  return `${base} ${height} ${size} !rounded-md !border-2 !border-white !bg-white !text-[#04550B] focus:!border-white focus:!ring-2 focus:!ring-white/80 disabled:!bg-white`;
});

const iconSizeClass = computed(() =>
  isDetail.value || isModal.value
    ? 'size-5'
    : isExplore.value
      ? 'size-3.5'
      : isCart.value
        ? 'size-3'
        : 'size-4',
);
</script>

<template>
  <div
    :class="[
      'flex',
      stripLayoutClass,
      isDetail ? '' : 'w-full',
      stripShellClass,
      disabled && 'pointer-events-none opacity-60',
    ]"
    @click.stop
  >
    <button
      type="button"
      :class="minusBtnClass"
      :disabled="minusDisabled"
      :aria-label="showTrashOnMinus ? 'Remove item' : 'Decrease quantity'"
      @click="onMinusOrTrash"
    >
      <Loader2 v-if="minusLoading" :class="[iconSizeClass, 'animate-spin text-white']" />
      <Trash2 v-else-if="showTrashOnMinus" :class="iconSizeClass" />
      <Minus v-else :class="iconSizeClass" />
    </button>

    <div
      :class="[
        'flex min-h-0 flex-shrink-0 flex-grow-0',
        centerShellClass,
      ]"
    >
      <Input
        :model-value="draftQty"
        type="text"
        inputmode="numeric"
        maxlength="3"
        :disabled="disabled || controlsBusy"
        :class="stripInputClass"
        aria-label="Quantity"
        @update:model-value="onDraftQtyUpdate"
        @focus="onQtyFocus"
        @blur="onQtyBlur"
        @keydown.enter.prevent="onQtyEnter"
      />
    </div>

    <button
      type="button"
      :class="plusBtnClass"
      :disabled="plusDisabled"
      aria-label="Increase quantity"
      @click="onPlus"
    >
      <Loader2 v-if="plusLoading" :class="[iconSizeClass, 'animate-spin text-white']" />
      <Plus v-else :class="iconSizeClass" />
    </button>
  </div>
</template>
