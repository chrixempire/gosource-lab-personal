<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  type DropdownMenuContentEmits,
  type DropdownMenuContentProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<DropdownMenuContentProps & { class?: string }>(),
  {
    sideOffset: 8,
    class: undefined,
  },
);

const emits = defineEmits<DropdownMenuContentEmits>();
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-[14px] border border-grey-50 bg-background-on-canvas p-1 shadow-[0_18px_40px_-20px_rgba(16,24,40,0.28)]',
          props.class,
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
