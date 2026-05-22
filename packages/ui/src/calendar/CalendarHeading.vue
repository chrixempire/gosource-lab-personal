<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  CalendarHeading,
  type CalendarHeadingProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../lib/cn';

const props = defineProps<CalendarHeadingProps & { class?: HTMLAttributes['class'] }>();

defineSlots<{
  default: (props: { headingValue: string }) => unknown;
}>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarHeading
    v-slot="{ headingValue }"
    :class="cn('text-sm font-medium text-grey-900', props.class)"
    v-bind="forwardedProps"
  >
    <slot :heading-value="headingValue">
      {{ headingValue }}
    </slot>
  </CalendarHeading>
</template>
