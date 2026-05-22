<script setup lang="ts">
import {
  TooltipContent,
  type TooltipContentEmits,
  type TooltipContentProps,
  TooltipPortal,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<TooltipContentProps & { class?: string }>(),
  {
    sideOffset: 8,
  },
);

const emits = defineEmits<TooltipContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="forwarded"
      :class="
        cn(
          'z-[100] overflow-hidden rounded-lg border border-grey-50 bg-white px-3 py-1.5 text-sm font-medium text-grey-900 shadow-md',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          props.class,
        )
      "
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
