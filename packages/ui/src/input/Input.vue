<script setup lang="ts">
import { cn } from '../lib/cn';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    invalid?: boolean;
    class?: string;
    label?: string;
    hint?: string;
  }>(),
  {
    modelValue: '',
    invalid: false,
    class: undefined,
    label: undefined,
    hint: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const attrs = useAttrs();
const inputId = useId();

const hasFieldChrome = computed(() => Boolean(props.label || props.hint));

const inputClass = computed(() =>
  cn(
    'flex h-10 w-full rounded-[10px] bg-grey-55 px-4 py-2.5 text-[14px] text-grey-900 shadow-none outline-none transition placeholder:text-grey-400 disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
    props.invalid
      ? 'border border-negative-500 focus:border-negative-500'
      : 'border border-border-input-default focus:border-border-input-active',
    props.class,
  ),
);
</script>

<template>
  <div v-if="hasFieldChrome" class="flex w-full flex-col gap-2">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-grey-900">
      {{ label }}
    </label>
    <p v-if="hint" class="text-xs text-grey-500">
      {{ hint }}
    </p>
    <input
      :id="inputId"
      v-bind="attrs"
      :value="props.modelValue"
      :class="inputClass"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
  <input
    v-else
    v-bind="attrs"
    :value="props.modelValue"
    :class="inputClass"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
