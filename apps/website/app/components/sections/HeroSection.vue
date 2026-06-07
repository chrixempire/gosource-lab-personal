<script setup lang="ts">
import { CUSTOMER_REGISTER_URL } from '~/lib/customer-app';
// Floating produce. Positions are expressed against the dark hero card.
const produce = [
  { src: '/images/hero-food-04.png', cls: 'right-[31%] top-[10%] w-16 sm:w-20 lg:w-24', rot: '-18deg', dur: '7s', delay: '0s', hideSm: false },
  { src: '/images/hero-food-03.png', cls: 'right-[5%] top-[14%] w-16 sm:w-20 lg:w-24', rot: '8deg', dur: '6.5s', delay: '0.6s', hideSm: false },
  { src: '/images/hero-food-02.png', cls: 'right-[17%] top-[40%] w-20 sm:w-24 lg:w-28', rot: '14deg', dur: '8s', delay: '0.3s', hideSm: true },
  { src: '/images/hero-food-01.png', cls: 'right-[4%] top-[52%] w-20 sm:w-24 lg:w-28', rot: '-12deg', dur: '7.5s', delay: '1s', hideSm: true },
  { src: '/images/hero-food-07.png', cls: 'right-[24%] bottom-[16%] w-14 sm:w-16 lg:w-20', rot: '-6deg', dur: '6s', delay: '0.9s', hideSm: false },
  { src: '/images/hero-food-06.png', cls: 'right-[34%] bottom-[6%] w-12 sm:w-14 lg:w-16', rot: '10deg', dur: '6.8s', delay: '0.2s', hideSm: false },
];
</script>

<template>
  <section class="bg-white pt-3 sm:pt-4">
    <div class="mx-auto w-full max-w-[1346px] px-4 sm:px-6">
      <div
        class="relative isolate overflow-hidden rounded-3xl bg-supporting-900 px-6 py-14 sm:px-10 sm:py-16 lg:rounded-[2.5rem] lg:px-16 lg:py-20"
        style="background: radial-gradient(120% 130% at 85% 10%, #0b4a16 0%, #073210 55%, #041c05 100%);"
      >
        <!-- bright green leaves, bottom-left -->
        <img
          src="/images/hero-food-05.png"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-4 left-0 w-32 opacity-90 sm:w-44 lg:w-52"
        />
        <!-- pale mint leaves, bottom-right -->
        <img
          src="/images/hero-food-08.png"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute bottom-0 right-0 w-28 opacity-80 sm:w-40 lg:w-48"
        />

        <!-- floating produce -->
        <img
          v-for="(p, i) in produce"
          :key="i"
          :src="p.src"
          alt=""
          aria-hidden="true"
          class="animate-float pointer-events-none absolute drop-shadow-xl"
          :class="[p.cls, p.hideSm ? 'hidden sm:block' : '']"
          :style="{ '--rot': p.rot, '--float-dur': p.dur, '--float-delay': p.delay }"
        />

        <!-- copy -->
        <div class="relative z-10 max-w-2xl">
          <h1 v-reveal class="text-display text-white">
            All your food supplies in
            <span class="block text-serif-accent text-[1.08em] leading-[0.95] text-cream">
              one platform
            </span>
          </h1>
          <p
            v-reveal="120"
            class="mt-6 max-w-xl text-base leading-relaxed text-primary-50/85 sm:text-lg"
          >
            GoSource is the modern way to source food in Nigeria — connecting
            restaurants, hotels, caterers and households to fresh supplies at
            bulk prices.
          </p>

          <div v-reveal="220" class="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <AppButton variant="primary" size="lg" :href="CUSTOMER_REGISTER_URL" class="sm:w-auto">
              Get started for free
              <Icon
                name="lucide:chevron-right"
                class="size-5 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </AppButton>
            <AppButton variant="white" size="lg" href="#">
              <Icon name="lucide:apple" class="size-5" />
              <span class="h-4 w-px bg-grey-200" />
              <Icon name="lucide:smartphone" class="size-5" />
              <span class="ml-1">Download app</span>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
