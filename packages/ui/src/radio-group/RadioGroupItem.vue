<script setup lang="ts">
import {
  RadioGroupIndicator,
  RadioGroupItem,
  type RadioGroupItemEmits,
  type RadioGroupItemProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<
    RadioGroupItemProps & {
      class?: string;
      indicatorClass?: string;
    }
  >(),
  {
    disabled: false,
  },
);

const emits = defineEmits<RadioGroupItemEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <RadioGroupItem
    v-bind="forwarded"
    :class="
      cn(
        'peer inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-white align-middle shadow-[0_1px_2px_rgba(16,24,40,0.06)] outline-none transition-all',
        'border-grey-100 hover:border-primary-500/35',
        'data-[state=checked]:border-primary-500/35',
        'focus-visible:ring-4 focus-visible:ring-primary-500/12',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <span
        :class="
          cn(
            'block size-2 rounded-full bg-[#04550B]',
            props.indicatorClass,
          )
        "
      />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
