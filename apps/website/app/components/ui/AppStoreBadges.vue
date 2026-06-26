<script setup lang="ts">
import { MOBILE_DOWNLOAD_LINKS } from '~/lib/mobile-download';

withDefaults(
  defineProps<{
    size?: 'md' | 'lg';
    /** White layer behind Google Play badge — use on dark backgrounds (e.g. homepage hero). */
    playStoreBg?: boolean;
  }>(),
  { size: 'lg', playStoreBg: false },
);

const badgeClass = {
  md: 'h-10 w-auto',
  lg: 'h-12 w-auto sm:h-[3rem]',
} as const;
</script>

<template>
  <div class="flex flex-wrap items-center gap-4 sm:gap-6">
    <a
      :href="MOBILE_DOWNLOAD_LINKS.android"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download GoSource on Google Play"
      class="relative inline-block transition-transform duration-200 hover:scale-[1.02]"
    >
      <span
        v-if="playStoreBg"
        class="pointer-events-none absolute inset-0 rounded-lg bg-white"
        aria-hidden="true"
      />
      <img
        src="/images/google-play.svg"
        alt=""
        :class="[badgeClass[size], 'relative block']"
        loading="lazy"
      />
    </a>
    <a
      :href="MOBILE_DOWNLOAD_LINKS.ios"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download GoSource on the App Store"
      class="transition-transform duration-200 hover:scale-[1.02]"
    >
      <img
        src="/images/apple-app-store.svg"
        alt=""
        :class="badgeClass[size]"
        loading="lazy"
      />
    </a>
  </div>
</template>
