<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  image: string;
  name: string;
  price: string;
  oldPrice?: string;
  unit?: string;
  /** "-12%" renders a discount disc, anything else (e.g. "New") a corner pill. */
  badge?: string;
}>();

const qty = ref(0);
const inCart = computed(() => qty.value > 0);

const discount = computed(() =>
  props.badge && props.badge.trim().startsWith('-') ? props.badge.replace('-', '') : null,
);
const tag = computed(() => (props.badge && !discount.value ? props.badge : null));

function add() {
  qty.value += 1;
}
function remove() {
  if (qty.value > 0) qty.value -= 1;
}
</script>

<template>
  <article
    :class="[
      'flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white transition-[transform,border-color,background-color] duration-300 ease-out hover:-translate-y-1',
      inCart
        ? 'border-2 border-primary-500 bg-primary-50/40'
        : 'border border-grey-100 hover:border-primary-500/35',
    ]"
  >
    <!-- Image -->
    <div class="relative aspect-[1.12/1] w-full shrink-0 overflow-hidden bg-grey-50">
      <img
        :src="image"
        :alt="name"
        loading="lazy"
        class="h-full w-full object-contain p-3 transition-transform duration-500 hover:scale-105"
      />

      <span
        v-if="discount"
        class="absolute right-2 top-2 z-10 flex size-[3rem] flex-col items-center justify-center rounded-full bg-primary-500 text-center text-white shadow-sm"
      >
        <span class="text-[0.8125rem] font-bold leading-none">{{ discount }}</span>
        <span class="mt-0.5 text-[0.5625rem] font-medium leading-none">Off</span>
      </span>
      <span
        v-else-if="tag"
        class="absolute left-2 top-2 z-10 rounded-full bg-orange-500 px-2 py-1 text-[0.6875rem] font-bold leading-none text-white shadow-sm"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex flex-1 flex-col gap-1.5 px-3 pb-2.5 pt-2.5">
      <h3 class="line-clamp-2 min-h-[2.5rem] text-[0.875rem] font-medium leading-snug text-grey-900">
        {{ name }}
      </h3>
      <div class="mt-auto space-y-1">
        <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span class="text-[0.9375rem] font-bold leading-tight tabular-nums text-grey-900">{{ price }}</span>
          <span v-if="oldPrice" class="text-[0.75rem] tabular-nums text-grey-400 line-through">{{ oldPrice }}</span>
        </div>
        <p v-if="unit" class="line-clamp-1 text-[0.6875rem] text-grey-400">{{ unit }}</p>
      </div>
    </div>

    <!-- Separator -->
    <div class="w-full shrink-0 border-t border-grey-100" role="presentation" />

    <!-- Action -->
    <div class="px-3 pb-2.5 pt-2.5">
      <Transition name="swap" mode="out-in">
        <button
          v-if="!inCart"
          key="add"
          type="button"
          class="flex h-9 w-full cursor-pointer items-center justify-center gap-1 rounded-full bg-primary-500 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(4,85,11,0.58)] transition hover:bg-primary-600"
          @click="add"
        >
          <Icon name="lucide:plus" class="size-4" /> Add
        </button>

        <div
          v-else
          key="strip"
          class="flex h-9 w-full items-center overflow-hidden rounded-full bg-primary-500 p-0.5 text-white shadow-sm"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            class="flex h-full basis-[35%] cursor-pointer items-center justify-center rounded-l-full transition hover:bg-white/15"
            @click="remove"
          >
            <Icon name="lucide:minus" class="size-4" />
          </button>
          <span class="flex basis-[30%] items-center justify-center text-sm font-bold tabular-nums">{{ qty }}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            class="flex h-full basis-[35%] cursor-pointer items-center justify-center rounded-r-full transition hover:bg-white/15"
            @click="add"
          >
            <Icon name="lucide:plus" class="size-4" />
          </button>
        </div>
      </Transition>
    </div>
  </article>
</template>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition: all 0.18s var(--ease-spring);
}
.swap-enter-from,
.swap-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
