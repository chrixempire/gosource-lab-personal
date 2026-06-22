<script setup lang="ts">
import { Input } from '@gosource/ui';
import {
  formatFormattedNumberInput,
  sanitizeFormattedNumberInput,
} from '~/lib/credit-money';

const model = defineModel<string>({ default: '' });

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
    allowDecimal?: boolean;
    inputmode?: 'numeric' | 'decimal';
  }>(),
  {
    placeholder: '0',
    allowDecimal: false,
    inputmode: 'numeric',
  },
);

function onUpdate(value: string) {
  const allowDecimal = props.allowDecimal === true;
  const sanitized = sanitizeFormattedNumberInput(value, allowDecimal);
  model.value = formatFormattedNumberInput(sanitized, allowDecimal);
}
</script>

<template>
  <Input
    :model-value="model"
    :inputmode="props.inputmode"
    :placeholder="props.placeholder"
    :invalid="props.invalid"
    :disabled="props.disabled"
    @update:model-value="onUpdate"
  />
</template>
