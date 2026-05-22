<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { computed, type HTMLAttributes } from 'vue';
import { CalendarPrev, type CalendarPrevProps, useForwardProps } from 'reka-ui';
import { buttonVariants } from '../button';
import { cn } from '../lib/cn';

const props = defineProps<CalendarPrevProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarPrev
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
      <ChevronLeft class="h-4 w-4" />
    </slot>
  </CalendarPrev>
</template>
