<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Render the full wordmark. When false, only the basket mark is shown. */
    withWordmark?: boolean;
    /** Use the white wordmark for dark backgrounds. */
    light?: boolean;
  }>(),
  { withWordmark: true, light: false },
);
</script>

<template>
  <!-- Mark only — the GoSource basket -->
  <svg
    v-if="!withWordmark"
    class="h-7 w-auto shrink-0"
    viewBox="0 0 27 24"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.357 1.87392C16.0439 1.87392 18.4766 3.46534 19.5501 5.93251L21.267 5.18231C19.8953 2.034 16.7878 0 13.357 0C9.05985 0 5.3842 3.20481 4.80664 7.45801L6.66487 7.70912C7.11687 4.38189 9.99524 1.87392 13.357 1.87392Z"
      fill="#19B820"
    />
    <path
      d="M26.1536 8.6416H0.562181C0.16668 8.6416 -0.103265 9.0371 0.0379857 9.40749L5.54048 23.6392C5.62523 23.8558 5.83239 24.0002 6.06467 24.0002H20.648C20.8803 24.0002 21.0874 23.8589 21.1722 23.6392L26.6747 9.40749C26.8159 9.04024 26.546 8.6416 26.1505 8.6416H26.1536ZM21.2695 15.3996C19.8947 18.5448 16.7903 20.5788 13.3595 20.5788C9.06232 20.5788 5.38667 17.374 4.80911 13.1208L6.66734 12.8697C7.11934 16.1969 9.99771 18.7049 13.3595 18.7049C15.7168 18.7049 17.8764 17.4807 19.0974 15.5189L12.7348 13.0423L13.416 11.2971L21.6619 14.5082L21.2726 15.4028L21.2695 15.3996Z"
      fill="#19B820"
    />
  </svg>

  <!-- Full wordmark — the official GoSource logo -->
  <img
    v-else
    :src="light ? '/svgs/logo-gosource-white.svg' : '/svgs/logo-gosource.svg'"
    alt="GoSource"
    class="h-6 w-auto select-none lg:h-7"
    draggable="false"
  />
</template>
