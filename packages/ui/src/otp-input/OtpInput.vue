<script setup lang="ts">
import { OTPInput, REGEXP_ONLY_DIGITS } from 'vue-input-otp';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    invalid?: boolean;
    class?: string;
    maxlength?: number;
    align?: 'left' | 'center';
  }>(),
  {
    modelValue: '',
    invalid: false,
    class: undefined,
    maxlength: 6,
    align: 'center',
  },
);

const slotRowClass = computed(() =>
  props.align === 'left' ? 'justify-start' : 'justify-center',
);

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  complete: [value: string];
}>();
</script>

<template>
  <OTPInput
    :model-value="props.modelValue"
    :maxlength="props.maxlength"
    :pattern="REGEXP_ONLY_DIGITS"
    inputmode="numeric"
    autocomplete="one-time-code"
    :container-class="cn('w-full', props.class)"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @complete="emit('complete', $event)"
  >
    <template #default="{ slots }">
      <div class="flex items-center gap-2" :class="slotRowClass">
        <template v-for="(slot, index) in slots" :key="index">
          <div
            :class="
              cn(
                'relative flex size-12 items-center justify-center rounded-[12px] bg-grey-55 text-base font-semibold text-grey-900 transition',
                props.invalid
                  ? 'border border-negative-500'
                  : slot.isActive
                    ? 'border border-border-input-active'
                    : 'border border-border-input-default',
              )
            "
          >
            <span>{{ slot.char ?? '' }}</span>
            <span
              v-if="slot.hasFakeCaret"
              class="pointer-events-none absolute inset-y-3 w-px animate-pulse bg-grey-900"
            />
          </div>

          <span
            v-if="slots.length === 4 && index === 1"
            class="px-1 text-sm font-semibold text-grey-300"
            aria-hidden="true"
          >
            -
          </span>
        </template>
      </div>
    </template>
  </OTPInput>
</template>
