<script setup lang="ts">
import { computed, ref } from 'vue';

const testimonials = [
  {
    lead: 'GoSource is efficient, cost effective and most importantly their staff are',
    rest: ' always ready to proffer solutions to the regular issues Lagos will present you with. As a small business owner this is invaluable.',
    name: 'Seun Adebajo',
    role: 'Co-founder, Red Gourmet Kitchen',
    initials: 'SA',
    ring: 'from-orange-200 to-orange-500',
  },
  {
    lead: 'We cut our procurement time in half.',
    rest: ' Ordering in bulk used to take a full day of phone calls — now it is a few taps and the supplies arrive the next morning. Game-changing for our kitchen.',
    name: 'Amaka Obi',
    role: 'Operations Lead, Lagoon Hotels',
    initials: 'AO',
    ring: 'from-primary-200 to-primary-600',
  },
  {
    lead: 'The credit option keeps our cash flow healthy.',
    rest: ' We can stock up ahead of busy weekends and pay later without stress. The dashboard makes it easy to see exactly where every naira goes.',
    name: 'Tunde Bakare',
    role: 'Owner, Spice Route Catering',
    initials: 'TB',
    ring: 'from-purple-200 to-purple-500',
  },
];

const active = ref(0);
const current = computed(() => testimonials[active.value] ?? testimonials[0]!);
</script>

<template>
  <section class="bg-grey-75 py-20 lg:py-28">
    <div class="site-container">
      <div class="mx-auto max-w-3xl text-center">
        <!-- brand stamp -->
        <div v-reveal class="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-wine-500/30 text-wine-500">
          <span class="font-serif-accent text-lg italic">Gourmet</span>
        </div>

        <Transition name="fade" mode="out-in">
          <blockquote :key="active" class="mt-10">
            <p class="text-h2 text-grey-900">
              {{ current.lead }}<span class="text-grey-400">{{ current.rest }}</span>
            </p>
          </blockquote>
        </Transition>

        <Transition name="fade" mode="out-in">
          <div :key="active" class="mt-8">
            <p class="font-display text-lg font-medium text-grey-900">{{ current.name }}</p>
            <p class="mt-1 text-sm text-grey-500">{{ current.role }}</p>
          </div>
        </Transition>

        <!-- avatar switcher -->
        <div class="mt-8 flex items-center justify-center gap-3">
          <button
            v-for="(t, i) in testimonials"
            :key="t.name"
            type="button"
            :aria-label="`Show testimonial from ${t.name}`"
            :aria-pressed="active === i"
            class="rounded-full p-0.5 transition-all duration-300"
            :class="active === i ? 'bg-gradient-to-br ' + t.ring + ' scale-110' : 'bg-grey-200 opacity-60 hover:opacity-100'"
            @click="active = i"
          >
            <span class="flex size-11 items-center justify-center rounded-full bg-white text-xs font-semibold text-grey-700">
              {{ t.initials }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.35s var(--ease-spring);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
