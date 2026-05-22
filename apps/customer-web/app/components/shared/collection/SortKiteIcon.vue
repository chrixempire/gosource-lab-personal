<script setup lang="ts">
const props = withDefaults(defineProps<{
  direction?: 'asc' | 'desc' | null;
  active?: boolean;
  lightOnDark?: boolean;
}>(), {
  direction: null,
  active: false,
  lightOnDark: false,
});

const upClass = computed(() => {
  if (props.lightOnDark) {
    return props.direction === 'asc'
      ? 'fill-white'
      : 'fill-white/45';
  }

  return props.direction === 'asc'
    ? 'fill-grey-900'
    : 'fill-grey-300';
});

const downClass = computed(() => {
  if (props.lightOnDark) {
    return props.direction === 'desc'
      ? 'fill-white'
      : 'fill-white/45';
  }

  return props.direction === 'desc'
    ? 'fill-grey-900'
    : 'fill-grey-300';
});
</script>

<template>
  <span class="inline-flex flex-col items-center justify-center gap-[2px]">
    <svg viewBox="0 0 8 6" class="h-[6px] w-2" aria-hidden="true">
      <path :class="upClass" d="M4 0L8 6H0L4 0Z" />
    </svg>
    <svg viewBox="0 0 8 6" class="h-[6px] w-2" aria-hidden="true">
      <path :class="downClass" d="M4 6L0 0H8L4 6Z" />
    </svg>
  </span>
</template>
