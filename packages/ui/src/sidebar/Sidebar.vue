<script setup lang="ts">
import { computed, inject } from 'vue';
import { cn } from '../lib/cn';
import { sidebarContextKey } from './context';

const props = withDefaults(
  defineProps<{
    class?: string;
    width?: string;
    collapsedWidth?: string;
  }>(),
  {
    width: '17rem',
    collapsedWidth: '0rem',
  },
);

const context = inject(sidebarContextKey, null);

const currentWidth = computed(() => {
  if (!context) {
    return props.width;
  }

  return context.open.value ? props.width : props.collapsedWidth;
});

const translatedClass = computed(() => {
  if (!context) {
    return 'translate-x-0';
  }

  return context.open.value ? 'translate-x-0' : '-translate-x-full';
});
</script>

<template>
  <div
    class="shrink-0 overflow-hidden box-border transition-[width] duration-300 ease-out"
    :style="{ width: currentWidth }"
  >
    <div
      :class="
        cn(
          'h-full box-border transition-transform duration-300 ease-out',
          translatedClass,
          props.class,
        )
      "
      :style="{ width: props.width }"
    >
      <slot />
    </div>
  </div>
</template>
