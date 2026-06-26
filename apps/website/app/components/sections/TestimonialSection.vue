<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const testimonials = [
  {
    brandLogo: '/images/testimonials/spicy-corner.png',
    brandAlt: 'Spicy Corner',
    quote:
      'We no longer have to deal with multiple suppliers or chasing people with phone calls to supply us on time. Take take out orders and we expect delivery within 24hours. The service and experience is brilliant.',
    name: 'Busayo',
    role: 'Co-founder, Spicy Corner',
    avatar: '/images/testimonials/spicycornerceo.png',
  },
  {
    brandLogo: '/images/testimonials/redg.png',
    brandAlt: 'Red Gourmet Kitchen',
    quote:
      'GoSource is efficient, cost effective and most importantly their staff are always ready to proffer solutions to the regular issues Lagos will present you with. As a small business owner this is invaluable.',
    name: 'Seun Adebajo',
    role: 'Co-founder, Red Gourmet Kitchen',
    avatar: '/images/testimonials/redceo.png',
  },
  {
    brandLogo: '/images/testimonials/citysub.png',
    brandAlt: 'City Subs',
    quote:
      'GoSource has shown they love my business and it’s clear from the way they operate. They also provide the logistics service we use daily. It has given us time to focus on selling great food to our customers.',
    name: 'Demi Odunubi',
    role: 'Co-founder, City Subs',
    avatar: '/images/testimonials/citysubceo.png',
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
        <!-- Brand logo -->
        <Transition name="slide" mode="out-in">
          <img
            :key="active"
            v-reveal
            :src="current.brandLogo"
            :alt="current.brandAlt"
            class="h-16 w-auto"
          />
        </Transition>

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
