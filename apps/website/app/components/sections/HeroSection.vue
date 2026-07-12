<script setup lang="ts">
// Floating produce. Positions are expressed against the dark hero card.
const produce = [
  { src: '/images/hero-food-04.png', cls: 'right-[31%] top-[10%] w-16 sm:w-20 lg:w-24', rot: '-18deg', dur: '7s', delay: '0s', hideSm: false },
  { src: '/images/hero-food-03.png', cls: 'right-[5%] top-[14%] w-16 sm:w-20 lg:w-24', rot: '8deg', dur: '6.5s', delay: '0.6s', hideSm: false },
  { src: '/images/hero-food-02.png', cls: 'right-[17%] top-[40%] w-20 sm:w-24 lg:w-28', rot: '14deg', dur: '8s', delay: '0.3s', hideSm: true },
  { src: '/images/hero-food-01.png', cls: 'right-[4%] top-[52%] w-20 sm:w-24 lg:w-28', rot: '-12deg', dur: '7.5s', delay: '1s', hideSm: true },
  { src: '/images/hero-food-07.png', cls: 'right-[24%] bottom-[16%] w-14 sm:w-16 lg:w-20', rot: '-6deg', dur: '6s', delay: '0.9s', hideSm: false },
  { src: '/images/hero-food-06.png', cls: 'right-[34%] bottom-[6%] w-12 sm:w-14 lg:w-16', rot: '10deg', dur: '6.8s', delay: '0.2s', hideSm: false },
  { src: '/images/hero-food-04.png', cls: 'right-[44%] top-[24%] w-14 sm:w-16 lg:w-20', rot: '5deg', dur: '7.2s', delay: '0.45s', hideSm: true },
  { src: '/images/hero-food-03.png', cls: 'right-[12%] bottom-[36%] w-14 sm:w-16 lg:w-20', rot: '-11deg', dur: '6.4s', delay: '0.7s', hideSm: false },
];

// Live category images (transparent PNGs) drift in the hero when available; falls back
// to the static illustrations otherwise. Keeps each slot's position/size/animation.
interface HeroCategory {
  image: string;
}

const { data: liveCategories } = useFetch<HeroCategory[]>('/api/catalog', {
  lazy: true,
  default: () => [] as HeroCategory[],
});

const floats = computed(() => {
  const images = (liveCategories.value ?? []).map((category) => category.image).filter(Boolean);
  if (images.length < produce.length) {
    return produce;
  }
  return produce.map((slot, index) => ({ ...slot, src: images[index] }));
});
</script>

<template>
  <section class="bg-white pt-3 sm:pt-4">
    <div class="site-container">
      <div
        class="relative isolate overflow-hidden rounded-3xl bg-supporting-900 px-6 py-14 sm:px-10 sm:py-16 lg:rounded-[2.5rem] lg:px-16 lg:py-20"
        style="background: radial-gradient(135% 130% at 80% 0%, #26c62e 0%, #19b820 32%, #12921a 60%, #0a640f 100%);"
      >
        <!-- Animated brand-green aurora glows -->
        <div class="animate-aurora pointer-events-none absolute -right-16 -top-24 z-0 h-80 w-80 rounded-full bg-primary-500/40 blur-[90px]" aria-hidden="true" />
        <div class="animate-aurora-alt pointer-events-none absolute -bottom-28 left-1/3 z-0 h-72 w-72 rounded-full bg-primary-400/30 blur-[100px]" aria-hidden="true" />
        <div class="animate-aurora pointer-events-none absolute right-1/4 top-1/3 z-0 h-64 w-64 rounded-full bg-primary-500/35 blur-[80px]" style="animation-delay: -6s;" aria-hidden="true" />

        <!-- Slow-rotating brand-green conic glow behind the produce (desktop) -->
        <div
          class="animate-hero-spin pointer-events-none absolute -right-24 top-1/2 z-0 hidden h-[38rem] w-[38rem] -translate-y-1/2 rounded-full opacity-20 blur-2xl lg:block"
          style="background: conic-gradient(from 0deg, transparent 0deg, #19b820 80deg, transparent 190deg, #3fc346 290deg, transparent 360deg);"
          aria-hidden="true"
        />

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
          v-for="(p, i) in floats"
          :key="i"
          :src="p.src"
          alt=""
          aria-hidden="true"
          class="animate-float pointer-events-none absolute max-h-24 object-contain drop-shadow-xl sm:max-h-28"
          :class="[p.cls, p.hideSm ? 'hidden sm:block' : '']"
          :style="{ '--rot': p.rot, '--float-dur': p.dur, '--float-delay': p.delay }"
        />

        <!-- copy -->
        <div class="relative z-10 max-w-2xl">
          <span
            v-reveal
            class="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-primary-100 backdrop-blur-sm"
          >
            <span class="size-1.5 rounded-full bg-primary-400" aria-hidden="true" />
            Fresh supplies, bulk prices
          </span>
          <h1 v-reveal="80" class="text-display text-white">
            All your food supplies in
            <span class="hero-accent block text-serif-accent text-[1.08em] leading-[0.95]">
              one platform
            </span>
          </h1>
          <p
            v-reveal="180"
            class="mt-6 max-w-xl text-base leading-relaxed text-primary-50/85 sm:text-lg"
          >
            GoSource is the modern way to source food in Nigeria — connecting
            restaurants, hotels, caterers and households to fresh supplies at
            bulk prices.
          </p>

          <div v-reveal="220" class="mt-9">
            <AppStoreBadges />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
