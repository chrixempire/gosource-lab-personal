<script setup lang="ts">
import { DialogTitle, type DialogTitleProps, useForwardProps } from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<DialogTitleProps & { class?: string }>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DialogTitle
    v-bind="forwarded"
    :class="cn('font-display text-[1.45rem] leading-tight tracking-[-0.02em] text-grey-900', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
