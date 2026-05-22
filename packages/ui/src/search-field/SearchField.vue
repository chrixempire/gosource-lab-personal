<script setup lang="ts">
import { Search, X } from 'lucide-vue-next';
import { cn } from '../lib/cn';
import { Input } from '../input';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

function onClear() {
  emit('update:modelValue', '');
}
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-grey-400" />
    <Input
      :model-value="modelValue"
      :placeholder="placeholder ?? 'Search...'"
      :disabled="disabled"
      :class="cn('pl-10', modelValue && 'pr-10')"
      @update:model-value="emit('update:modelValue', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-grey-55 hover:text-grey-700"
      aria-label="Clear search"
      @click="onClear"
    >
      <X class="size-4" />
    </button>
  </div>
</template>
