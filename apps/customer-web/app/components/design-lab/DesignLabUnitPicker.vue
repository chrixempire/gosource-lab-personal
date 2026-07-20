<script setup lang="ts">
import type { DesignLabUnit } from '~/lib/design-lab';
import { formatNaira } from '~/composables/useMarketplaceCart';

defineProps<{
  units: DesignLabUnit[];
  selected: string;
  accent: string;
  inCart?: (unit: string) => number;
}>();
defineEmits<{ select: [unit: string] }>();
</script>

<template>
  <div>
    <p class="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-grey-500">Choose unit</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="u in units"
        :key="u.name"
        type="button"
        class="flex flex-col items-start rounded-xl border px-3 py-2 text-left transition"
        :style="selected === u.name ? { borderColor: accent, background: accent + '14' } : { borderColor: '#E5E5E5' }"
        @click="$emit('select', u.name)"
      >
        <span class="flex items-center gap-1.5 text-[13px] font-semibold" :style="selected === u.name ? { color: accent } : { color: '#1a1a1a' }">
          {{ u.name }}
          <span v-if="inCart && inCart(u.name)" class="rounded-full px-1.5 text-[11px] font-bold text-white" :style="{ background: accent }">{{ inCart(u.name) }}</span>
        </span>
        <span class="text-[12px] text-grey-500">{{ formatNaira(u.priceNaira) }}</span>
      </button>
    </div>
  </div>
</template>
