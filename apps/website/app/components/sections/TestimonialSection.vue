<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const testimonials = [
  {
    quote:
      'GoSource is efficient, cost effective and most importantly their staff are always ready to proffer solutions to the regular issues Lagos will present you with. As a small business owner this is invaluable.',
    name: 'Seun Adebajo',
    role: 'Co-founder, Red Gourmet Kitchen',
    avatar: '/images/testimonials/avatar-seun.png',
  },
  {
    quote:
      'We cut our procurement time in half. Ordering in bulk used to take a full day of phone calls — now it is a few taps and the supplies arrive the next morning. Game-changing for our kitchen.',
    name: 'Amaka Obi',
    role: 'Operations Lead, Lagoon Hotels',
    avatar: '/images/testimonials/avatar-amaka.png',
  },
  {
    quote:
      'The credit option keeps our cash flow healthy. We stock up ahead of busy weekends and pay later without stress, and the dashboard shows us exactly where every naira goes.',
    name: 'Chioma Okafor',
    role: 'Owner, Spice Route Catering',
    avatar: '/images/testimonials/avatar-chioma.png',
  },
];

const active = ref(0);
const revealed = ref(0); // number of words turned black in the current quote

const current = computed(() => testimonials[active.value]!);
const words = computed(() => current.value.quote.split(' '));

const STEP_MS = 120; // time between each word turning black
const HOLD_MS = 1800; // pause once the whole quote is black
const SLIDE_MS = 550; // slide transition duration

let timer: ReturnType<typeof setInterval> | undefined;
let paused = false;

function goTo(i: number) {
  // Pause the reveal while the quote slides so the next one enters all-grey.
  paused = true;
  revealed.value = 0;
  active.value = ((i % testimonials.length) + testimonials.length) % testimonials.length;
  window.setTimeout(() => {
    paused = false;
  }, SLIDE_MS);
}

function tick() {
  if (paused) return;
  if (revealed.value < words.value.length) {
    revealed.value += 1;
    return;
  }
  // Fully revealed → hold, then slide to the next testimonial.
  paused = true;
  window.setTimeout(() => goTo(active.value + 1), HOLD_MS);
}

function select(i: number) {
  if (i === active.value) return;
  goTo(i);
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    revealed.value = words.value.length; // show fully, no motion
    return;
  }
  timer = setInterval(tick, STEP_MS);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section class="overflow-hidden bg-grey-50 py-20 lg:py-28">
    <div class="site-container">
      <div class="mx-auto flex max-w-[52rem] flex-col items-center text-center">
        <!-- Red Gourmet Kitchen stamp -->
        <img
          v-reveal
          src="/images/testimonials/gourmet-stamp.png"
          alt="Red Gourmet Kitchen"
          class="h-16 w-auto"
        />

        <!-- Quote — words animate grey → black, then slide away -->
        <Transition name="slide" mode="out-in">
          <blockquote :key="active" class="mt-12">
            <p class="font-medium leading-[1.5] tracking-[-0.5px] text-[1.625rem] sm:text-[2.125rem]">
              <template v-for="(w, i) in words" :key="i"
                ><span
                  class="transition-colors duration-500 ease-out"
                  :class="i < revealed ? 'text-grey-900' : 'text-grey-500'"
                  >{{ w }}</span
                >{{ ' ' }}</template
              >
            </p>
          </blockquote>
        </Transition>

        <!-- Author -->
        <Transition name="slide" mode="out-in">
          <div :key="active" class="mt-10">
            <p class="font-display text-lg font-medium tracking-[-0.2px] text-grey-900">{{ current.name }}</p>
            <p class="mt-0.5 text-sm tracking-[0.1px] text-grey-700">{{ current.role }}</p>
          </div>
        </Transition>

        <!-- Avatars -->
        <div class="mt-10 flex items-center justify-center gap-3">
          <button
            v-for="(t, i) in testimonials"
            :key="t.name"
            type="button"
            :aria-label="`Show testimonial from ${t.name}`"
            :aria-pressed="active === i"
            class="overflow-hidden rounded-full transition-all duration-500 ease-[var(--ease-spring)]"
            :class="active === i ? 'size-11 opacity-100 ring-2 ring-grey-300/60' : 'size-8 opacity-40 hover:opacity-70'"
            @click="select(i)"
          >
            <img :src="t.avatar" :alt="t.name" class="size-full object-cover" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.55s var(--ease-spring),
    transform 0.55s var(--ease-spring);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(56px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-56px);
}
</style>
