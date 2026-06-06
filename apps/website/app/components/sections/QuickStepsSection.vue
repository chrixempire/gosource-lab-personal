<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const steps = [
  { n: 1, title: 'Create an account', desc: 'Create an account for your business in less than 2 minutes.' },
  { n: 2, title: 'Add to cart with ease', desc: 'Add multiple items you want to buy in bulk in no time.' },
  { n: 3, title: 'Swift checkout', desc: 'Proceed to give us delivery information and checkout very fast.' },
];

/**
 * Auto-advancing stepper. A phase counter loops 0..5:
 *   phase 0 → step 1 active
 *   phase 1 → connector 1 fills green
 *   phase 2 → step 2 active
 *   phase 3 → connector 2 fills green
 *   phase 4 → step 3 active
 *   phase 5 → hold, then loop back (lines + badges reset smoothly)
 */
const PHASES = 6;
const PHASE_MS = 1000;
const phase = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

// How many step badges are green (0-based highest reached step).
const reached = computed(() => Math.floor(phase.value / 2));
// Connector i is filled once we've started flowing past step i.
const filled = (i: number) => phase.value >= i * 2 + 1;
const isActive = (i: number) => i === reached.value;
const isDone = (i: number) => i <= reached.value;

// Browser-mock CTA: continuously flips "Create account" ⇄ "Login" in a vertical
// circular motion, as if a cursor were toggling it.
const flip = ref(0);
const FLIP_MS = 2600;
let flipTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    phase.value = PHASES - 1; // show the completed state, no motion
    return;
  }
  timer = setInterval(() => {
    phase.value = (phase.value + 1) % PHASES;
  }, PHASE_MS);
  flipTimer = setInterval(() => {
    flip.value += 1;
  }, FLIP_MS);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  if (flipTimer) clearInterval(flipTimer);
});
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container">
      <SectionHeading
        eyebrow="Quick steps"
        eyebrow-class="!text-orange-500"
        title="Place your first order"
        align="center"
        max-width="40rem"
        class="mx-auto"
      />

      <div class="mt-14 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <!-- Stepper -->
        <ol class="relative">
          <li
            v-for="(s, i) in steps"
            :key="s.n"
            v-reveal="i * 120"
            class="relative flex gap-5 pb-10 last:pb-0"
          >
            <!-- connector track + animated green fill -->
            <span
              v-if="i < steps.length - 1"
              class="absolute left-[1.0625rem] top-9 h-[calc(100%-1rem)] w-0.5 overflow-hidden rounded-full bg-grey-200"
              aria-hidden="true"
            >
              <span
                class="absolute inset-x-0 top-0 w-full rounded-full bg-primary-500 transition-[height] duration-700 ease-out"
                :style="{ height: filled(i) ? '100%' : '0%' }"
              />
            </span>

            <!-- number badge -->
            <span
              class="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-500"
              :class="[
                isDone(i)
                  ? 'bg-primary-500 text-white'
                  : 'bg-grey-100 text-grey-400',
                isActive(i) ? 'shadow-[0_0_0_5px_rgba(25,184,32,0.16)]' : '',
              ]"
            >
              {{ s.n }}
            </span>

            <div class="pt-1">
              <h3
                class="font-display text-lg font-medium transition-colors duration-500"
                :class="isDone(i) ? 'text-grey-900' : 'text-grey-500'"
              >
                {{ s.title }}
              </h3>
              <p class="mt-1.5 max-w-xs text-[0.95rem] leading-relaxed text-grey-500">{{ s.desc }}</p>
            </div>
          </li>
        </ol>

        <!-- Browser mockup -->
        <div v-reveal="120" class="rounded-3xl bg-grey-50 p-5 sm:p-8">
          <div class="overflow-hidden rounded-2xl bg-white shadow-medium">
            <div class="flex items-center gap-3 border-b border-grey-100 px-4 py-3">
              <div class="flex items-center gap-3 text-grey-400">
                <Icon name="lucide:arrow-left" class="size-4" />
                <Icon name="lucide:arrow-right" class="size-4" />
                <Icon name="lucide:rotate-cw" class="size-4" />
              </div>
              <div class="flex-1 truncate rounded-lg bg-grey-50 px-3 py-1.5 text-xs text-grey-400">
                https://www.app.gosource.com
              </div>
            </div>
            <div class="space-y-4 p-6">
              <div class="skeleton h-9 w-2/5 rounded-lg" />
              <div class="space-y-2">
                <div class="skeleton h-3 w-4/5 rounded" />
                <div class="skeleton h-3 w-2/3 rounded" />
              </div>
              <div class="skeleton h-12 w-full rounded-xl" style="background-color: var(--color-grey-75)" />
              <div class="skeleton h-12 w-full rounded-xl" style="background-color: var(--color-grey-75)" />

              <!-- Auto-flipping CTA -->
              <div class="flip-stage mt-2 h-12 w-full">
                <div class="flip-inner" :style="{ transform: `rotateX(${flip * 180}deg)` }">
                  <span class="flip-face flip-front">Create account</span>
                  <span class="flip-face flip-back">Login</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flip-stage {
  perspective: 700px;
}
.flip-inner {
  position: relative;
  height: 100%;
  width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.75s var(--ease-spring);
}
.flip-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background-color: var(--color-primary-500);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-back {
  transform: rotateX(180deg);
}
</style>
