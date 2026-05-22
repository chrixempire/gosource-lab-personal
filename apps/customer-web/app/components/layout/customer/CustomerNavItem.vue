<script setup lang="ts">
import type { Component } from 'vue';
import { cn } from '@gosource/ui';

const props = defineProps<{
  label: string;
  path: string;
  icon: Component;
  active?: boolean;
}>();
</script>

<template>
  <NuxtLink
    :to="props.path"
    :class="
      cn(
        'group flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold transition-colors',
        props.active
          ? 'bg-primary-50 text-primary-500'
          : 'text-grey-300 hover:bg-grey-55 hover:text-grey-900',
      )
    "
  >
    <component :is="props.icon" class="size-[18px]" />
    <span>{{ props.label }}</span>
  </NuxtLink>
</template>
