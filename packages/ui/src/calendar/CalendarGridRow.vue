<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  CalendarGridRow,
  type CalendarGridRowProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<CalendarGridRowProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarGridRow :class="cn('flex', props.class)" v-bind="forwardedProps">
    <slot />
  </CalendarGridRow>
</template>
