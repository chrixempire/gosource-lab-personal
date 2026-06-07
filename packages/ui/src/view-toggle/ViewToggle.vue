<script setup lang="ts">
import { LayoutGrid, Rows3 } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: 'cards' | 'table';
}>();

const emit = defineEmits<{
  'update:modelValue': ['cards' | 'table'];
}>();

const activeIndex = computed(() => (props.modelValue === 'cards' ? 0 : 1));
</script>

<template>
  <div
    class="relative hidden h-10 min-w-[152px] grid-cols-2 rounded-[12px] border border-grey-50 bg-background-on-canvas p-1 shadow-[0_12px_32px_-24px_rgba(16,24,40,0.22)] transition-colors duration-300 min-[1000px]:inline-grid"
  >
    <span
      aria-hidden="true"
      class="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-[8px] bg-primary-500 shadow-[0_10px_24px_-18px_rgba(4,85,11,0.9)] transition-transform duration-250 ease-out"
      :style="{ transform: `translateX(${activeIndex * 100}%)` }"
    />

    <button
      type="button"
      class="relative z-[1] inline-flex cursor-pointer items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-semibold transition-colors duration-200"
      :class="modelValue === 'cards' ? 'text-white' : 'text-grey-500 hover:text-grey-900'"
      @click="emit('update:modelValue', 'cards')"
    >
      <LayoutGrid class="size-4 shrink-0" />
      <span>Cards</span>
    </button>

    <button
      type="button"
      class="relative z-[1] inline-flex cursor-pointer items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-semibold transition-colors duration-200"
      :class="modelValue === 'table' ? 'text-white' : 'text-grey-500 hover:text-grey-900'"
      @click="emit('update:modelValue', 'table')"
    >
      <Rows3 class="size-4 shrink-0" />
      <span>Table</span>
    </button>
  </div>
</template>
