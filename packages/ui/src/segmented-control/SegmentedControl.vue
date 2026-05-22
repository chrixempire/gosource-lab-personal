<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '../lib/cn';

export type SegmentedControlOption = {
  label: string;
  value: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SegmentedControlOption[];
    class?: string;
  }>(),
  {
    class: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const activeIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  ),
);

const segmentCount = computed(() => Math.max(props.options.length, 1));
</script>

<template>
  <div
    role="tablist"
    :class="
      cn(
        'relative inline-grid rounded-full border border-grey-50 bg-white p-1',
        props.class,
      )
    "
    :style="{ gridTemplateColumns: `repeat(${segmentCount}, minmax(0, 1fr))` }"
  >
    <span
      aria-hidden="true"
      class="absolute bottom-1 left-1 top-1 rounded-full bg-primary-500 shadow-[0_10px_24px_-18px_rgba(4,85,11,0.9)] transition-transform duration-250 ease-out"
      :style="{
        width: `calc(${100 / segmentCount}% - 4px)`,
        transform: `translateX(${activeIndex * 100}%)`,
      }"
    />

    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      class="relative z-[1] inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200"
      :class="modelValue === option.value ? 'text-white' : 'text-grey-300 hover:text-grey-900'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
