<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  type DialogContentEmits,
  type DialogContentProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<DialogContentProps & { class?: string; overlayClass?: string; side?: 'bottom' | 'left' | 'right' }>(),
  {
    class: undefined,
    overlayClass: undefined,
    side: 'bottom',
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
          'fixed inset-0 z-50 bg-[rgba(16,24,40,0.48)] backdrop-blur-[2px] transition-opacity duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
          props.overlayClass,
        )
      "
    />

    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          props.side === 'bottom'
            ? 'fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col overflow-hidden rounded-t-[28px] border border-b-0 border-grey-50 bg-background-on-canvas shadow-[0_-24px_64px_-24px_rgba(16,24,40,0.42)] outline-none transition-transform duration-300 ease-out data-[state=closed]:translate-y-full data-[state=open]:translate-y-0'
            : props.side === 'right'
              ? 'fixed inset-y-0 right-0 z-50 flex h-screen w-[min(88vw,22rem)] flex-col overflow-hidden border border-r-0 border-grey-50 bg-background-on-canvas shadow-[-24px_0_64px_-24px_rgba(16,24,40,0.42)] outline-none transition-transform duration-300 ease-out data-[state=closed]:translate-x-full data-[state=open]:translate-x-0'
              : 'fixed inset-y-0 left-0 z-50 flex h-screen w-[min(86vw,19rem)] flex-col overflow-hidden border border-l-0 border-grey-50 bg-background-on-canvas shadow-[24px_0_64px_-24px_rgba(16,24,40,0.42)] outline-none transition-transform duration-300 ease-out data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
          props.class,
        )
      "
    >
      <DialogClose
        v-if="props.side === 'bottom'"
        type="button"
        :class="
          cn(
            'mx-auto mt-3 flex w-full shrink-0 cursor-pointer flex-col items-center justify-center border-0 bg-transparent py-2.5 outline-none',
            'touch-manipulation hover:bg-grey-55/50 active:bg-grey-55/70',
            'focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-grey-200 focus-visible:ring-offset-2',
          )
        "
        aria-label="Close drawer"
      >
        <span class="pointer-events-none h-1.5 w-12 rounded-full bg-grey-200 sm:w-14" aria-hidden="true" />
      </DialogClose>
      <slot />
    </DialogContent>
  </DialogPortal>
</template>
