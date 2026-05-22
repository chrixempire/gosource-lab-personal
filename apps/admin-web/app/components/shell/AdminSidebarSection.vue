<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  visible?: boolean;
}>();

const showContent = computed(() => props.visible !== false && props.open);
</script>

<template>
  <div
    class="grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out"
    :class="showContent ? 'mt-1 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'"
  >
    <div class="min-h-0 space-y-1 overflow-hidden">
      <slot />
    </div>
  </div>
</template>
