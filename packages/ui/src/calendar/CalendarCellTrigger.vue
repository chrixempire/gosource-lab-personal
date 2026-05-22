<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  CalendarCellTrigger,
  type CalendarCellTriggerProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarCellTrigger
    :class="
      cn(
        'flex h-9 w-9 items-center justify-center rounded-md p-0 text-sm font-normal',
        '[&[data-today]:not([data-selected])]:bg-grey-55 [&[data-today]:not([data-selected])]:text-grey-900 cursor-pointer',
        'data-[selected]:bg-button-primary data-[selected]:text-white data-[selected]:opacity-100 data-[selected]:hover:bg-button-primary data-[selected]:hover:text-white data-[selected]:focus:bg-button-primary data-[selected]:focus:text-white',
        'data-[disabled]:cursor-not-allowed data-[disabled]:text-grey-300 data-[disabled]:opacity-50',
        'data-[unavailable]:line-through',
        'data-[outside-view]:text-grey-300 data-[outside-view]:opacity-50 [&[data-outside-view][data-selected]]:bg-grey-55 [&[data-outside-view][data-selected]]:text-grey-300 [&[data-outside-view][data-selected]]:opacity-60',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarCellTrigger>
</template>
