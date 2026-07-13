<script setup lang="ts">
import { CUSTOMER_MARKET_URL, CUSTOMER_REGISTER_URL } from '~/lib/customer-app';
import { MOBILE_DOWNLOAD_LINKS } from '~/lib/mobile-download';

/**
 * Hero slider (Figma 891-23356). Two full-width rounded slides:
 *  0 — purple: headline + CTAs, with LIVE floating category produce on the right.
 *  1 — peach:  "Deals combo", with a delivery rider that drives right → left.
 * The peach slide stays exactly as long as the rider takes to cross, then it
 * slides out and the purple slide returns. The track always moves left, so a
 * cloned purple panel sits after the peach one and we snap back invisibly.
 */

interface HeroCategory {
  image: string;
}

const { data: liveCategories } = useFetch<HeroCategory[]>('/api/catalog', {
  lazy: true,
  default: () => [] as HeroCategory[],
});

// Floating produce slots on the purple slide's right side. Live category images
// fill them when available; static produce is the fallback.
const fallbackFloats = [
  '/images/hero-food-01.png',
  '/images/hero-food-02.png',
  '/images/hero-food-03.png',
  '/images/hero-food-04.png',
  '/images/hero-food-06.png',
  '/images/hero-food-07.png',
];
// Sizes mirror the Figma floats (~75–120px on the 1346px slide) — deliberately small.
const floatSlots = [
  { cls: 'right-[8%] top-[13%] w-9 sm:w-11 lg:w-[70px]', rot: '-14deg', dur: '7s', delay: '0s' },
  { cls: 'right-[25%] top-[10%] w-8 sm:w-10 lg:w-14', rot: '11deg', dur: '6.5s', delay: '.4s' },
  { cls: 'right-[32%] top-[46%] w-9 sm:w-11 lg:w-[66px]', rot: '-8deg', dur: '8s', delay: '.2s' },
  { cls: 'right-[9%] top-[44%] w-10 sm:w-12 lg:w-20', rot: '14deg', dur: '7.4s', delay: '.7s' },
  { cls: 'right-[18%] bottom-[15%] w-9 sm:w-11 lg:w-16', rot: '6deg', dur: '6.8s', delay: '.3s' },
  { cls: 'right-[5%] bottom-[24%] w-8 sm:w-10 lg:w-[60px]', rot: '-12deg', dur: '7.8s', delay: '.9s' },
];
const floats = computed(() => {
  const imgs = (liveCategories.value ?? []).map((c) => c.image).filter(Boolean);
  return floatSlots.map((slot, i) => ({
    ...slot,
    src: imgs[i] ?? fallbackFloats[i % fallbackFloats.length],
  }));
});

// --- Slider timeline -------------------------------------------------------
const TRANSITION_MS = 800;
const PURPLE_MS = 4500;
const BIKE_MS = 6500; // rider crossing time == peach dwell time

// Panels: [purple, peach, purple-clone]. pos drives translateX(-pos*100%).
const pos = ref(0);
const withTransition = ref(true);
const riding = ref(false);

let timers: ReturnType<typeof setTimeout>[] = [];
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function cycle() {
  clearTimers();
  withTransition.value = true;
  pos.value = 0;
  riding.value = false;

  // Purple dwell → slide to peach.
  timers.push(
    setTimeout(() => {
      pos.value = 1;
      // Start the rider once the peach slide has settled.
      timers.push(setTimeout(() => (riding.value = true), TRANSITION_MS));
      // Peach dwell == transition-in + rider crossing → slide to the clone.
      timers.push(
        setTimeout(() => {
          riding.value = false;
          pos.value = 2;
          // After the clone settles, snap back to the real purple invisibly.
          timers.push(
            setTimeout(() => {
              withTransition.value = false;
              pos.value = 0;
              requestAnimationFrame(() =>
                requestAnimationFrame(() => cycle()),
              );
            }, TRANSITION_MS),
          );
        }, TRANSITION_MS + BIKE_MS),
      );
    }, PURPLE_MS),
  );
}

onMounted(() => {
  if (import.meta.client) cycle();
});
onBeforeUnmount(clearTimers);

const trackStyle = computed(() => ({
  transform: `translateX(-${pos.value * 100}%)`,
  transition: withTransition.value
    ? `transform ${TRANSITION_MS}ms cubic-bezier(0.65, 0.05, 0.36, 1)`
    : 'none',
}));

// The three panels: purple, peach, purple (clone for a seamless left loop).
const panels = ['purple', 'peach', 'purple'] as const;
</script>

<template>
  <section class="bg-white pt-3 sm:pt-4">
    <div class="site-container">
      <div class="overflow-hidden rounded-[32px]">
        <div class="flex" :style="trackStyle">
          <div
            v-for="(type, i) in panels"
            :key="i"
            class="relative w-full shrink-0 overflow-hidden rounded-[32px]"
          >
            <!-- ============ PURPLE SLIDE ============ -->
            <div
              v-if="type === 'purple'"
              class="relative flex min-h-[26rem] flex-col justify-center overflow-hidden bg-purple-50 px-6 py-14 sm:px-12 lg:h-[567px] lg:px-20 lg:py-0"
            >
              <!-- Background particles — positioned per Figma 952:7806 (card 1346×567) -->
              <img src="/images/hero/p-shape-br.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[44%] top-[30%] z-0 hidden w-[48.5%] select-none sm:block">
              <img src="/images/hero/p-leaves-bl.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-0 top-[78%] z-0 w-[15.8%] min-w-[66px] select-none">
              <img src="/images/hero/p-squiggle.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[65%] top-[60%] z-0 w-[6.6%] min-w-[38px] select-none">
              <img src="/images/hero/p-ribbon.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[77%] top-[76%] z-0 hidden w-[5%] min-w-[30px] select-none sm:block">
              <img src="/images/hero/p-dot-br.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[89.5%] top-[77%] z-0 w-[13.2%] min-w-[42px] select-none">

              <!-- floating live categories (right side) -->
              <img
                v-for="(p, fi) in floats"
                :key="fi"
                :src="p.src"
                alt=""
                aria-hidden="true"
                class="animate-float pointer-events-none absolute z-0 object-contain drop-shadow-xl"
                :class="p.cls"
                :style="{ '--rot': p.rot, '--float-dur': p.dur, '--float-delay': p.delay }"
              >

              <div class="relative z-10 max-w-xl">
                <h1 class="text-display !leading-[0.98] text-[#650e65]">
                  All your food supplies in
                  <span class="block text-serif-accent text-[1.06em] leading-[0.95] text-purple-500">
                    one platform
                  </span>
                </h1>
                <p class="mt-6 max-w-lg text-base leading-relaxed text-grey-700 sm:text-lg">
                  GoSource is the modern way to source food in Nigeria — connecting
                  restaurants, hotels, caterers and households to fresh supplies at
                  bulk prices.
                </p>
                <div class="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    :href="CUSTOMER_REGISTER_URL"
                    class="inline-flex h-12 items-center gap-2 rounded-full bg-primary-500 px-6 text-lg font-semibold text-white transition hover:bg-primary-600"
                  >
                    Get started for free
                    <Icon name="lucide:chevron-right" class="size-4" />
                  </a>
                  <a
                    :href="MOBILE_DOWNLOAD_LINKS.ios"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-lg font-semibold text-grey-900 shadow-sm transition hover:bg-grey-50"
                  >
                    <Icon name="lucide:apple" class="size-4" />
                    <Icon name="lucide:play" class="size-3.5" />
                    Download app
                  </a>
                </div>
              </div>
            </div>

            <!-- ============ PEACH / DEALS SLIDE ============ -->
            <div
              v-else
              class="relative flex min-h-[26rem] flex-col justify-center overflow-hidden bg-[#fcece9] px-6 py-14 sm:px-12 lg:h-[567px] lg:px-20 lg:py-0"
            >
              <!-- Background particles — positioned per Figma 952:8136 (card 1346×567) -->
              <img src="/images/hero/pe-confetti-2.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[27%] -top-[27%] z-0 hidden w-[48.4%] select-none sm:block">
              <img src="/images/hero/pe-confetti-1.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[35%] top-[20%] z-0 w-[65%] select-none">
              <img src="/images/hero/pe-leaves-bl.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-0 top-[78%] z-0 w-[15.8%] min-w-[66px] select-none">
              <img src="/images/hero/pe-squiggle-tr.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[85%] top-[10%] z-0 w-[6.6%] min-w-[38px] select-none">
              <img src="/images/hero/pe-dot-br.svg" alt="" aria-hidden="true" class="pointer-events-none absolute left-[89.5%] top-[77%] z-0 w-[13.2%] min-w-[42px] select-none">

              <div class="relative z-10 max-w-xl">
                <h2 class="text-display !leading-[0.98] text-[#7e2412]">
                  Deals combo
                  <span class="block text-serif-accent text-[1.06em] leading-[0.95] text-orange-500">
                    for you
                  </span>
                </h2>
                <p class="mt-6 max-w-lg text-base leading-relaxed text-grey-700 sm:text-lg">
                  Shop quality items at unbeatable prices — no market runs needed,
                  just source it on GoSource.
                </p>
                <div class="mt-8">
                  <a
                    :href="CUSTOMER_MARKET_URL"
                    class="inline-flex h-12 items-center gap-2 rounded-full bg-primary-500 px-6 text-lg font-semibold text-white transition hover:bg-primary-600"
                  >
                    Go to market
                    <Icon name="lucide:chevron-right" class="size-4" />
                  </a>
                </div>
              </div>

              <!-- Delivery rider — drives right → left across the slide -->
              <img
                src="/images/hero/rider-figure.svg"
                alt=""
                aria-hidden="true"
                width="382"
                height="367"
                class="pointer-events-none absolute bottom-[12%] z-10 h-auto w-52 -scale-x-100 select-none object-contain drop-shadow-xl will-change-transform sm:w-64 lg:w-[21rem]"
                :class="riding ? 'hero-ride' : 'left-full opacity-0'"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Rider crossing — synced to BIKE_MS via the JS timeline. */
.hero-ride {
  animation: hero-ride 6500ms linear forwards;
}

@keyframes hero-ride {
  from {
    left: 100%;
    opacity: 1;
  }
  to {
    left: -30%;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-ride {
    animation: none;
    left: 42%;
  }
}
</style>
