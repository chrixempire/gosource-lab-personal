<script setup lang="ts">
import {
  PopoverContent,
  PopoverPortal,
  type PopoverContentEmits,
  type PopoverContentProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: string }>(),
  {
    align: 'start',
    sideOffset: 8,
    class: undefined,
  },
);

const emits = defineEmits<PopoverContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 w-auto rounded-[14px] border border-grey-50 bg-background-on-canvas p-0 shadow-[0_18px_40px_-20px_rgba(16,24,40,0.28)] outline-none',
          props.class,
        )
      "
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
