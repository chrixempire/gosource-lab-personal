<script setup lang="ts">
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue,
} from '@internationalized/date';
import { CalendarIcon } from 'lucide-vue-next';
import { Calendar } from '../calendar';
import { cn } from '../lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const open = ref(false);
const formatter = new DateFormatter('en-GB', { dateStyle: 'medium' });
const defaultPlaceholder = today(getLocalTimeZone());

const value = computed({
  get: () => (props.modelValue ? parseDate(props.modelValue) : undefined),
  set: (value: DateValue | undefined) => emit('update:modelValue', value ? value.toString() : ''),
});

const displayLabel = computed(() => {
  if (!value.value) {
    return props.placeholder ?? 'Pick a date';
  }

  try {
    return formatter.format(value.value.toDate(getLocalTimeZone()));
  } catch {
    return props.modelValue;
  }
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        :class="
          cn(
            'inline-flex h-10 w-full items-center justify-start gap-2 rounded-[12px] border border-border-input-default bg-background-on-canvas px-3 text-left text-sm font-normal text-grey-900 transition hover:bg-grey-55/35 disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300',
            !modelValue && 'text-grey-300',
            props.class,
          )
        "
      >
        <CalendarIcon class="size-4 shrink-0 opacity-70" />
        <span class="truncate">{{ displayLabel }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        v-model="value"
        :default-placeholder="defaultPlaceholder"
        :min-value="new CalendarDate(1900, 1, 1)"
        :initial-focus="true"
        layout="month-and-year"
        @update:model-value="open = false"
      />
    </PopoverContent>
  </Popover>
</template>
