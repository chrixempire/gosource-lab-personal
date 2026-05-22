<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { computed, type HTMLAttributes } from 'vue';
import { CalendarNext, type CalendarNextProps, useForwardProps } from 'reka-ui';
import { buttonVariants } from '../button';
import { cn } from '../lib/cn';

const props = defineProps<CalendarNextProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarNext
    :class="
      cn(
        buttonVariants({ variant: 'outline', size: 'icon' }),
        'h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot>
      <ChevronRight class="h-4 w-4" />
    </slot>
  </CalendarNext>
</template>
