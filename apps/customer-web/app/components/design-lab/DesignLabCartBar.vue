<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next';
import { formatNaira } from '~/composables/useMarketplaceCart';

defineProps<{
  count: number;
  total: number;
  accent: string;
  fg?: string;
  label?: string;
}>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
  >
    <div
      v-if="count > 0"
      class="mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[14px] font-semibold shadow-sm"
      :style="{ background: accent, color: fg ?? '#ffffff' }"
    >
      <span class="flex items-center gap-2">
        <ShoppingCart class="size-4" />
        {{ count }} {{ count === 1 ? 'item' : 'items' }} added
      </span>
      <span class="flex items-center gap-3">
        {{ formatNaira(total) }}
        <span class="rounded-full bg-white/20 px-3 py-1 text-[13px]">{{ label ?? 'View cart' }}</span>
      </span>
    </div>
  </Transition>
</template>
