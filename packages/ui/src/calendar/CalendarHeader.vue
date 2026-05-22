<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  CalendarHeader,
  type CalendarHeaderProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<CalendarHeaderProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarHeader
    :class="cn('relative flex w-full items-center justify-between pt-1', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarHeader>
</template>
