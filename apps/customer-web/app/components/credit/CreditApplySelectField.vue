<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';
import type { CreditApplySelectOption } from '~/lib/credit-apply';

const props = defineProps<{
  modelValue: string;
  options: CreditApplySelectOption[];
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
  <label class="block space-y-2">
    <span class="text-[13px] font-semibold text-grey-text">
      <slot />
    </span>
    <DropdownMenu>
      <DropdownMenuTrigger as-child :disabled="props.disabled">
        <button
          type="button"
          :class="[
            'flex h-10 w-full items-center justify-between rounded-[10px] border bg-grey-55 px-4 py-2.5 text-left text-[14px] !shadow-none outline-none ring-0 focus-visible:ring-0 transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
            props.disabled ? '' : 'cursor-pointer',
            selectedLabel ? 'text-grey-900' : 'text-grey-400',
            props.error
              ? 'border-negative-500 focus:border-negative-500'
              : 'border-border-input-default focus:border-border-input-active data-[state=open]:border-border-input-active',
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
    <p v-if="props.error" class="text-[12px] font-medium text-negative-500">{{ props.error }}</p>
  </label>
</template>
