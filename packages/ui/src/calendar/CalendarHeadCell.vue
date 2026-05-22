<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  CalendarHeadCell,
  type CalendarHeadCellProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<CalendarHeadCellProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarHeadCell
    :class="cn('w-9 rounded-md text-[0.8rem] font-normal text-grey-300', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarHeadCell>
</template>
