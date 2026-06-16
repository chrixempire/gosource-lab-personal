<script setup lang="ts">
import { DialogTitle, type DialogTitleProps, useForwardProps } from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<DialogTitleProps & { class?: string }>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DialogTitle
    v-bind="forwarded"
    :class="cn('text-h3', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
