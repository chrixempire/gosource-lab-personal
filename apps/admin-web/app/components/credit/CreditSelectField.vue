<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';

export type CreditSelectOption = {
  label: string;
  value: string;
};

const props = defineProps<{
  modelValue: string;
  options: CreditSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? '',
);
</script>

<template>
  <label class="grid gap-1.5 text-sm">
    <span class="font-medium text-grey-800">
      <slot />
    </span>
    <DropdownMenu>
      <DropdownMenuTrigger as-child :disabled="props.disabled">
        <button
          type="button"
          :class="[
            'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-sm !shadow-none outline-none ring-0 transition focus-visible:ring-0 disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
            props.disabled ? '' : 'cursor-pointer',
            selectedLabel ? 'text-grey-900' : 'text-grey-400',
            props.error
              ? 'border-negative-500 focus:border-negative-500'
              : 'border-grey-50 focus:border-primary-500 data-[state=open]:border-primary-500',
          ]"
        >
          <span>{{ selectedLabel || props.placeholder || 'Select an option' }}</span>
          <ChevronDown class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="w-[var(--reka-dropdown-menu-trigger-width)]">
        <DropdownMenuItem
          v-for="option in props.options"
          :key="option.value"
          @select="emit('update:modelValue', option.value)"
        >
          <div class="flex w-full items-center justify-between gap-3">
            <span>{{ option.label }}</span>
            <Check v-if="props.modelValue === option.value" class="size-4 text-primary-500" />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <p v-if="props.error" class="text-xs font-medium text-negative-500">{{ props.error }}</p>
  </label>
</template>
