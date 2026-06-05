<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Render the wordmark next to the mark. */
    withWordmark?: boolean;
    /** Use light colours for dark backgrounds. */
    light?: boolean;
  }>(),
  { withWordmark: true, light: false },
);
</script>

<template>
  <span class="inline-flex items-center gap-2 select-none">
    <!-- Leaf "G" mark -->
    <svg
      class="h-7 w-7 shrink-0"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M27 6C18.5 4.2 8.6 7.4 6.2 16.1c-1.9 6.9 2.3 12.8 9.3 13.7 6 0.8 11.4-2.7 12.4-8.7.5-3-.4-5-2.6-5.6-2.2-.6-4.2.4-6 2"
        stroke="#19B820"
        stroke-width="3.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="15.5" cy="16.5" r="2.7" fill="#19B820" />
    </svg>
    <span
      v-if="withWordmark"
      class="font-display text-[1.35rem] font-semibold tracking-tight"
      :class="light ? 'text-white' : 'text-supporting-900'"
    >
      Go<span class="text-primary-500">Source</span>
    </span>
  </span>
</template>
