<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';

/**
 * Grocery "Add" affordance.
 * - Single-unit products: morphs into a "− [input] +" stepper (qty editable).
 * - Multi-unit products (multiUnit=true): stays an "Add" button that opens the
 *   modal/unit picker, showing an active state + count when already in cart
 *   (so the same product can be added in several units).
 */
const props = withDefaults(
  defineProps<{
    qty: number;
    accent: string;
    fg?: string;
    variant?: 'circle' | 'pill';
    outline?: boolean;
    multiUnit?: boolean;
    addLabel?: string;
  }>(),
  { fg: '#ffffff', variant: 'circle', outline: false, multiUnit: false, addLabel: 'Add' },
);

const emit = defineEmits<{ inc: []; dec: []; set: [n: number]; open: [] }>();

function onInput(e: Event) {
  const v = Math.max(0, Math.round(Number((e.target as HTMLInputElement).value) || 0));
  emit('set', v);
}

const solidStyle = computed(() =>
  props.outline ? {} : { background: props.accent, color: props.fg },
);
const outlineStyle = computed(() =>
  props.outline ? { borderColor: props.accent, color: props.accent } : {},
);
const active = computed(() => props.qty > 0);
</script>

<template>
  <!-- MULTI-UNIT: always an "Add" button (opens unit picker); active when in cart -->
  <template v-if="multiUnit">
    <button
      v-if="variant === 'circle'"
      type="button"
      class="relative flex size-8 items-center justify-center rounded-full border shadow-sm transition"
      :class="active || !outline ? 'border-transparent' : 'border bg-white'"
      :style="active || !outline ? { background: accent, color: fg } : outlineStyle"
      aria-label="Choose unit and add"
      @click.stop="emit('open')"
    >
      <Plus class="size-4" :stroke-width="3" />
      <span v-if="active" class="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-grey-900 px-1 text-[10px] font-bold text-white">{{ qty }}</span>
    </button>
    <button
      v-else
      type="button"
      class="flex w-full items-center justify-center gap-1 rounded-full border py-2 text-[14px] font-semibold transition"
      :class="active || !outline ? 'border-transparent' : 'border bg-white'"
      :style="active || !outline ? { background: accent, color: fg } : outlineStyle"
      @click.stop="emit('open')"
    >
      <Plus class="size-4" :stroke-width="3" />
      {{ active ? `${qty} in cart · Add unit` : addLabel }}
    </button>
  </template>

  <!-- SINGLE-UNIT, CIRCLE -->
  <template v-else-if="variant === 'circle'">
    <button
      v-if="qty === 0"
      type="button"
      class="flex size-8 items-center justify-center rounded-full border shadow-sm transition"
      :class="outline ? 'border bg-white' : 'border-transparent'"
      :style="{ ...solidStyle, ...outlineStyle }"
      aria-label="Add to cart"
      @click.stop="emit('inc')"
    >
      <Plus class="size-4" :stroke-width="3" />
    </button>
    <div
      v-else
      class="flex items-center gap-0.5 rounded-full border px-1 py-0.5 shadow-sm"
      :class="outline ? 'bg-white' : 'border-transparent'"
      :style="{ ...solidStyle, ...outlineStyle }"
      @click.stop
    >
      <button type="button" class="flex size-6 items-center justify-center" aria-label="Remove one" @click="emit('dec')"><Minus class="size-4" :stroke-width="3" /></button>
      <input
        type="number"
        min="0"
        :value="qty"
        class="w-7 bg-transparent text-center text-[14px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        :class="outline ? 'text-grey-900' : ''"
        @change="onInput"
      />
      <button type="button" class="flex size-6 items-center justify-center" aria-label="Add one" @click="emit('inc')"><Plus class="size-4" :stroke-width="3" /></button>
    </div>
  </template>

  <!-- SINGLE-UNIT, PILL -->
  <template v-else>
    <button
      v-if="qty === 0"
      type="button"
      class="flex w-full items-center justify-center gap-1 rounded-full border py-2 text-[14px] font-semibold transition"
      :class="outline ? 'border bg-white' : 'border-transparent'"
      :style="{ ...solidStyle, ...outlineStyle }"
      @click.stop="emit('inc')"
    >
      <Plus class="size-4" :stroke-width="3" /> {{ addLabel }}
    </button>
    <div
      v-else
      class="flex w-full items-center justify-between rounded-full border px-2 py-2"
      :class="outline ? 'bg-white' : 'border-transparent'"
      :style="{ ...solidStyle, ...outlineStyle }"
      @click.stop
    >
      <button type="button" class="flex size-6 items-center justify-center" aria-label="Remove one" @click="emit('dec')"><Minus class="size-4" :stroke-width="3" /></button>
      <input
        type="number"
        min="0"
        :value="qty"
        class="w-12 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        :class="outline ? 'text-grey-900' : ''"
        @change="onInput"
      />
      <button type="button" class="flex size-6 items-center justify-center" aria-label="Add one" @click="emit('inc')"><Plus class="size-4" :stroke-width="3" /></button>
    </div>
  </template>
</template>
