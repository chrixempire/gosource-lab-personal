<script setup lang="ts">
import { SearchField as UiSearchField } from '@gosource/ui';

defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <UiSearchField
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="class"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
