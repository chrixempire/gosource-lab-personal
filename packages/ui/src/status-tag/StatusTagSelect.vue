<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { cn } from '../lib/cn';
import StatusTag from './StatusTag.vue';
import type { StatusTagVariants } from '.';

type Option = {
  value: string;
  label: string;
  tagVariant: NonNullable<StatusTagVariants['variant']>;
};

const props = defineProps<{
  value: string;
  label: string;
  variant: NonNullable<StatusTagVariants['variant']>;
  options: Option[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [value: string];
}>();

const open = ref(false);

function onSelect(next: string) {
  if (next === props.value) {
    return;
  }
  emit('change', next);
}
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child :disabled="disabled">
      <button
        type="button"
        class="inline-flex rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-60"
        @click.stop
      >
        <StatusTag
          :variant="variant"
          size="medium"
          class="inline-flex items-center gap-1 rounded-full px-3 py-1 normal-case"
        >
          <span>{{ label }}</span>
          <ChevronDown class="size-3.5 shrink-0 opacity-80" />
        </StatusTag>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="max-h-64 overflow-y-auto">
      <DropdownMenuItem
        v-for="option in options"
        :key="option.value"
        :class="cn(option.value === value && 'bg-primary-50/70 text-primary-600')"
        @select="onSelect(option.value)"
      >
        <StatusTag :variant="option.tagVariant" size="medium">{{ option.label }}</StatusTag>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
