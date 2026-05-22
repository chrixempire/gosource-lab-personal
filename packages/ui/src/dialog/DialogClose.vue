<script setup lang="ts">
import { DialogClose, type DialogCloseProps, useForwardProps } from 'reka-ui';
import { X } from 'lucide-vue-next';
import { cn } from '../lib/cn';

const props = defineProps<DialogCloseProps & { class?: string }>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DialogClose
    v-bind="forwarded"
    :class="
      cn(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 transition-colors hover:bg-grey-55',
        props.class,
      )
    "
  >
    <slot>
      <span class="sr-only">Close</span>
      <X class="size-5" />
    </slot>
  </DialogClose>
</template>
