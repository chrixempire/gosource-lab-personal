<script setup lang="ts">
import { inject } from 'vue';
import { PanelLeft } from 'lucide-vue-next';
import { cn } from '../lib/cn';
import { sidebarContextKey } from './context';

const props = withDefaults(
  defineProps<{
    class?: string;
  }>(),
  {},
);

const context = inject(sidebarContextKey, null);
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'inline-flex size-10 items-center justify-center rounded-xl transition-colors',
        props.class,
      )
    "
    @click="context?.toggle()"
  >
    <span class="sr-only">Toggle sidebar</span>
    <PanelLeft class="size-5" />
  </button>
</template>
