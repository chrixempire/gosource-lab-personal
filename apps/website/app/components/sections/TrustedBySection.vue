<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'marquee' | 'about';
  }>(),
  { variant: 'marquee' },
);

const logos = [
  { src: '/images/partners/papas-grill.png', name: "Papa's Grill" },
  { src: '/images/partners/wings-bistro.png', name: 'Wings Bistro' },
  { src: '/images/partners/spicy-corner.png', name: 'Spicy Corner' },
  { src: '/images/partners/grill-shack.png', name: 'Grill Shack' },
  { src: '/images/partners/gourmet-kitchen.png', name: 'Red Gourmet Kitchen' },
  { src: '/images/partners/city-subs.png', name: 'City Subs' },
];

const aboutQuote =
  'Join the growing community of restaurants, cafés, hotels, and home chefs who source smarter with GoSource. "GoSource is how tomorrow\'s kitchens source today – and over 50 businesses agree!"';
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container flex flex-col items-center gap-8 lg:gap-8">
      <h2
        v-reveal
        class="text-center font-display text-2xl font-medium tracking-[-0.02em] text-grey-900"
      >
        Trusted by 50+ businesses across Nigeria
      </h2>

      <!-- About page — static logo row -->
      <div
        v-if="variant === 'about'"
        v-reveal="120"
        class="flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:justify-between lg:gap-x-10"
      >
        <img
          v-for="logo in logos"
          :key="logo.name"
          :src="logo.src"
          :alt="logo.name"
          loading="lazy"
          class="h-9 w-auto max-w-[7rem] shrink-0 object-contain opacity-90 transition duration-300 hover:opacity-100 sm:h-10 lg:h-14"
        />
      </div>

      <div v-else v-reveal="120" class="w-full">
        <div class="hmask marquee-hover-pause w-full overflow-hidden">
          <div class="flex w-max animate-hscroll items-center will-change-transform">
            <img
              v-for="(logo, i) in [...logos, ...logos]"
              :key="`${logo.name}-${i}`"
              :src="logo.src"
              :alt="i < logos.length ? logo.name : ''"
              :aria-hidden="i >= logos.length ? 'true' : undefined"
              loading="lazy"
              class="mx-8 h-8 w-auto shrink-0 opacity-80 transition duration-300 hover:opacity-100 sm:mx-10 sm:h-9 lg:mx-12 lg:h-10"
            />
          </div>
        </div>
      </div>

      <p
        v-reveal="180"
        class="max-w-[50.9375rem] text-center text-base leading-6 tracking-[0.00625em] text-grey-700"
      >
        {{ aboutQuote }}
      </p>
    </div>
  </section>
</template>
