<script setup lang="ts">
import type { Component } from 'vue';
import { cn } from '../lib/cn';

const props = withDefaults(
  defineProps<{
    as?: string | Component;
    class?: string;
    active?: boolean;
    to?: string;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    as: 'button',
    active: false,
    type: 'button',
  },
);

const componentProps = computed(() => {
  return {
    ...(props.to ? { to: props.to } : {}),
    ...(props.href ? { href: props.href } : {}),
    ...(props.as === 'button' ? { type: props.type } : {}),
  };
});
</script>

<template>
  <component
    :is="props.as"
    v-bind="componentProps"
    :class="
      cn(
        'flex w-full min-w-0 max-w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
        props.active
          ? 'bg-[#04550B] text-white dark:bg-primary-500/16 dark:text-[#86efac]'
          : 'text-grey-300 hover:bg-primary-50/70 hover:text-primary-500 dark:hover:bg-white/8 dark:hover:text-grey-900',
        props.class,
      )
    "
  >
    <slot />
  </component>
</template>
