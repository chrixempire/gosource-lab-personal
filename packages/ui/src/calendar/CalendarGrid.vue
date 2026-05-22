<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { CalendarGrid, type CalendarGridProps, useForwardProps } from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<CalendarGridProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarGrid
    :class="cn('w-full border-collapse space-y-1', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarGrid>
</template>
