<script setup lang="ts">
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  type DialogContentEmits,
  type DialogContentProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { twMerge } from 'tailwind-merge';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<DialogContentProps & { class?: string; overlayClass?: string }>(),
  {
    class: undefined,
    overlayClass: undefined,
  },
);

const emits = defineEmits<DialogContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      :class="
        cn(
          'fixed inset-0 z-50 bg-[rgba(16,24,40,0.52)] backdrop-blur-[2px]',
          props.overlayClass,
        )
      "
    />

    <DialogContent
      v-bind="forwarded"
      :class="
        twMerge(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[min(88vh,46rem)] w-[min(92vw,500px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-grey-50 bg-background-on-canvas shadow-[0_32px_80px_-32px_rgba(16,24,40,0.42)] outline-none',
          props.class,
        )
      "
    >
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
