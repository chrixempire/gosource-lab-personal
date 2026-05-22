<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next';
import {
  CheckboxIndicator,
  CheckboxRoot,
  type CheckboxRootEmits,
  type CheckboxRootProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<
    CheckboxRootProps & {
      class?: string;
    }
  >(),
  {
    disabled: false,
  },
);

const emits = defineEmits<CheckboxRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-grey-100 bg-white align-middle shadow-[0_1px_2px_rgba(16,24,40,0.06)] outline-none transition-all',
        'hover:border-grey-200',
        'data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500',
        'data-[state=indeterminate]:border-orange-500 data-[state=indeterminate]:bg-orange-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex items-center justify-center text-white">
      <Check
        v-if="props.modelValue === true"
        class="size-3.5 stroke-[3]"
      />
      <Minus
        v-else
        class="size-3.5 stroke-[3]"
      />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
