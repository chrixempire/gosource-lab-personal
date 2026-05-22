<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { Minus, Plus, Trash2 } from 'lucide-vue-next';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';

/** Commit typed quantity after pause in typing (avoids one API call per digit). */
const QTY_INPUT_DEBOUNCE_MS = 450;

const props = withDefaults(
  defineProps<{
    /** Cart / catalog mode — required unless `modelValue` is set (controlled / request lines). */
    productId?: string;
    /** Unit label matching cart line keys (see `effectiveUnitChoices`). */
    unit?: string;
    /** `modal`: taller strip. `cart`: compact strip for cart drawer and request lines. */
    variant?: 'card' | 'modal' | 'cart';
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

const { getQtyForUnit, setQuantityForUnit, increment, decrement, remove } = useMarketplaceCart();

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

watch(
  qty,
  (q) => {
    draftQty.value = String(Math.max(1, q || 1));
  },
  { immediate: true },
);

watch(
  () => props.unit,
  () => {
    draftQty.value = String(Math.max(1, qty.value || 1));
  },
);

async function commitControlled(parsed: number) {
  if (parsed === qty.value) {
    draftQty.value = String(parsed);
    return;
  }

  emit('update:modelValue', parsed);
}

async function commitDraft() {
  const parsed = Number.parseInt(draftQty.value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    draftQty.value = String(Math.max(1, qty.value));
    return;
  }

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

  await setQuantityForUnit(props.productId, props.unit, parsed);
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
  debouncedCommitDraft();
}

async function flushDebounceAndCommit() {
  cancelDebouncedCommit();
  await commitDraft();
}

async function onQtyBlur() {
  if (props.disabled) {
    return;
  }

  if (skipNextBlurCommit.value) {
    skipNextBlurCommit.value = false;
    return;
  }
  await flushDebounceAndCommit();
}

async function onQtyEnter(e: KeyboardEvent) {
  if (props.disabled) {
    return;
  }

  await flushDebounceAndCommit();
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
  await decrement(props.productId, props.unit);
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

  await increment(props.productId, props.unit);
}

const isModal = computed(() => props.variant === 'modal');
const isCart = computed(() => props.variant === 'cart');

const showTrashOnMinus = computed(() => {
  if (qty.value > 1) {
    return false;
  }

  if (isControlled.value) {
    return props.allowRemoveAtMin;
  }

  return true;
});

const minusDisabled = computed(
  () => props.disabled || (isControlled.value && qty.value <= 1 && !props.allowRemoveAtMin),
);
</script>

<template>
  <div
    :class="[
      'flex w-full items-stretch rounded-full bg-button-primary p-0.5 shadow-md',
      isModal ? 'h-12 min-h-12' : isCart ? 'h-7 min-h-7 w-full max-w-[7.5rem]' : 'h-9 min-h-9',
      disabled && 'pointer-events-none opacity-60',
    ]"
    @click.stop
  >
    <button
      type="button"
      :class="[
        'flex min-h-0 flex-shrink-0 flex-grow-0 items-center justify-center rounded-full text-white transition hover:bg-white/15',
        isCart ? 'basis-[30%] min-w-0' : 'min-w-0 basis-[35%]',
        isModal ? 'text-lg' : '',
        minusDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ]"
      :disabled="minusDisabled"
      :aria-label="showTrashOnMinus ? 'Remove item' : 'Decrease quantity'"
      @click="onMinusOrTrash"
    >
      <Trash2 v-if="showTrashOnMinus" :class="isModal ? 'size-5' : isCart ? 'size-3' : 'size-4'" />
      <Minus v-else :class="isModal ? 'size-5' : isCart ? 'size-3' : 'size-4'" />
    </button>

    <div
      :class="[
        'flex min-h-0 flex-shrink-0 flex-grow-0 items-center justify-center rounded-md border-2 border-white bg-white shadow-inner focus-within:border-white focus-within:ring-2 focus-within:ring-white/80',
        isModal ? 'min-h-10 basis-[30%] px-1' : isCart ? 'min-h-6 min-w-0 basis-[40%] px-1' : 'min-h-8 basis-[30%] px-1',
      ]"
    >
      <input
        v-model="draftQty"
        type="text"
        inputmode="numeric"
        maxlength="3"
        :disabled="disabled"
        :class="[
          'w-full min-w-0 bg-transparent text-center font-semibold tabular-nums text-[#04550B] outline-none ring-0 placeholder:text-grey-300',
          isModal ? 'text-base' : isCart ? 'text-[12px]' : 'text-[14px]',
        ]"
        aria-label="Quantity"
        @input="onQtyInput"
        @blur="onQtyBlur"
        @keydown.enter.prevent="onQtyEnter"
      >
    </div>

    <button
      type="button"
      :class="[
        'flex min-h-0 flex-shrink-0 flex-grow-0 items-center justify-center rounded-full text-white transition hover:bg-white/15',
        isCart ? 'basis-[30%] min-w-0' : 'min-w-0 basis-[35%]',
        isModal ? 'text-lg' : '',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ]"
      :disabled="disabled"
      aria-label="Increase quantity"
      @click="onPlus"
    >
      <Plus :class="isModal ? 'size-5' : isCart ? 'size-3' : 'size-4'" />
    </button>
  </div>
</template>
