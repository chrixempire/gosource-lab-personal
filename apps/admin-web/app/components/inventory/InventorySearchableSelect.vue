<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SearchField,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';
import { PRODUCT_ITEM_SELECT_TRIGGER_CLASS } from '~/lib/product-form';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

const props = defineProps<{
  modelValue: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const searchQuery = ref('');

const selectedLabel = computed(() => {
  if (!props.modelValue) {
    return '';
  }

  const exact = props.options.find((option) => option.value === props.modelValue);
  if (exact) {
    return exact.label;
  }

  const normalized = props.modelValue.toLowerCase();
  const loose = props.options.find(
    (option) =>
      option.value.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized,
  );

  return loose?.label ?? props.modelValue;
});

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return props.options;
  }

  return props.options.filter((option) => option.label.toLowerCase().includes(query));
});

function onSelect(value: string) {
  emit('update:modelValue', value);
  searchQuery.value = '';
}
</script>

<template>
  <DropdownMenu @update:open="(open) => !open && (searchQuery = '')">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        :class="[PRODUCT_ITEM_SELECT_TRIGGER_CLASS, invalid ? 'border-negative-500' : '']"
      >
        <span :class="selectedLabel ? 'text-grey-900' : 'text-grey-400'">
          {{ selectedLabel || placeholder || 'Select' }}
        </span>
        <ChevronDown class="size-4 shrink-0 text-grey-300" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      class="max-h-72 w-[var(--reka-dropdown-menu-trigger-width)] overflow-hidden p-0"
    >
      <div class="border-b border-grey-50 p-2" @click.stop>
        <SearchField v-model="searchQuery" placeholder="Search" />
      </div>
      <div class="max-h-52 overflow-y-auto p-1">
        <DropdownMenuItem
          v-for="option in filteredOptions"
          :key="option.value"
          :class="
            [
              'flex items-center justify-between gap-3 rounded-xl border border-transparent',
              modelValue === option.value
                ? 'border-primary-200 bg-primary-50/50 text-primary-700'
                : '',
            ]
          "
          @select="onSelect(option.value)"
        >
          <span class="truncate">{{ option.label }}</span>
          <Check v-if="modelValue === option.value" class="size-4 shrink-0 text-primary-500" />
        </DropdownMenuItem>
        <p
          v-if="filteredOptions.length === 0"
          class="px-3 py-4 text-center text-sm text-grey-500"
        >
          No results found
        </p>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
