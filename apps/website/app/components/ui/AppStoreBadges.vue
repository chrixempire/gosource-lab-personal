<script setup lang="ts">
import { MOBILE_DOWNLOAD_LINKS } from '~/lib/mobile-download';

withDefaults(
  defineProps<{
    size?: 'md' | 'lg';
  }>(),
  { size: 'lg' },
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
      class="inline-block transition-transform duration-200 hover:scale-[1.02]"
    >
      <img
        src="/images/google-play.png"
        alt=""
        :class="[badgeClass[size], 'block']"
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
