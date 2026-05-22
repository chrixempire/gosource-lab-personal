<script setup lang="ts">
import { DropdownMenuSubTrigger, type DropdownMenuSubTriggerProps } from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<DropdownMenuSubTriggerProps & { class?: string }>();
</script>

<template>
  <DropdownMenuSubTrigger
    v-bind="props"
    :class="
      cn(
        'flex cursor-pointer select-none items-center rounded-[10px] px-3 py-2 text-[13px] text-grey-900 outline-none transition focus:bg-primary-500/8 focus:text-grey-900 data-[state=open]:bg-primary-500/8 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuSubTrigger>
</template>
