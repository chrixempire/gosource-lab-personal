<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  image: string;
  name: string;
  price: string;
  oldPrice?: string;
  badge?: string;
}>();

const qty = ref(0);
function add() {
  qty.value += 1;
}
function remove() {
  if (qty.value > 0) qty.value -= 1;
}
</script>

<template>
  <div
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-grey-100 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-grey-200 hover:shadow-medium"
  >
    <div class="relative mb-3 aspect-square overflow-hidden rounded-xl bg-grey-50">
      <span
        v-if="badge"
        class="absolute left-2 top-2 z-10 rounded-full bg-primary-500 px-2 py-0.5 text-[0.625rem] font-semibold text-white shadow-sm"
      >
        {{ badge }}
      </span>
      <img
        :src="image"
        :alt="name"
        loading="lazy"
        class="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
      />

      <!-- Add control -->
      <div class="absolute bottom-2 right-2">
        <Transition name="swap" mode="out-in">
          <button
            v-if="qty === 0"
            key="add"
            type="button"
            class="flex items-center gap-1 rounded-full border border-primary-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
            @click="add"
          >
            <Icon name="lucide:plus" class="size-3.5" /> Add
          </button>
          <div
            v-else
            key="stepper"
            class="flex items-center gap-2 rounded-full bg-primary-500 px-1.5 py-1 text-white shadow-sm"
          >
            <button type="button" aria-label="Remove one" class="flex size-5 items-center justify-center rounded-full transition hover:bg-white/20" @click="remove">
              <Icon name="lucide:minus" class="size-3.5" />
            </button>
            <span class="min-w-4 text-center text-xs font-bold tabular-nums">{{ qty }}</span>
            <button type="button" aria-label="Add one" class="flex size-5 items-center justify-center rounded-full transition hover:bg-white/20" @click="add">
              <Icon name="lucide:plus" class="size-3.5" />
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <p class="line-clamp-2 min-h-[2.5rem] text-[0.8125rem] font-medium leading-snug text-grey-700">
      {{ name }}
    </p>
    <div class="mt-1.5 flex items-baseline gap-2">
      <span class="text-sm font-bold text-grey-900">{{ price }}</span>
      <span v-if="oldPrice" class="text-xs text-grey-400 line-through">{{ oldPrice }}</span>
    </div>
  </div>
</template>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition: all 0.18s var(--ease-spring);
}
.swap-enter-from,
.swap-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
