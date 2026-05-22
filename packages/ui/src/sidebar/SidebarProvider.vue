<script setup lang="ts">
import { provide } from 'vue';
import { sidebarContextKey } from './context';

const open = defineModel<boolean>('open', {
  default: true,
});

function setOpen(value: boolean) {
  open.value = value;
}

function toggle() {
  open.value = !open.value;
}

provide(sidebarContextKey, {
  open,
  setOpen,
  toggle,
});
</script>

<template>
  <slot />
</template>
