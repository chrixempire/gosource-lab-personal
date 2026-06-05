<script setup lang="ts">
const steps = [
  { n: 1, title: 'Create an account', desc: 'Create an account for your business in less than 2 minutes.' },
  { n: 2, title: 'Add to cart with ease', desc: 'Add multiple items you want to buy in bulk in no time.' },
  { n: 3, title: 'Swift checkout', desc: 'Proceed to give us delivery information and checkout very fast.' },
];
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
            <!-- connector -->
            <span
              v-if="i < steps.length - 1"
              class="absolute left-[1.1rem] top-9 h-[calc(100%-1rem)] w-px bg-grey-200"
              aria-hidden="true"
            />
            <span
              class="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              :class="s.n === 1 ? 'bg-primary-500 text-white shadow-[0_6px_16px_-4px_rgba(25,184,32,0.6)]' : 'bg-grey-100 text-grey-400'"
            >
              {{ s.n }}
            </span>
            <div class="pt-1">
              <h3 class="font-display text-lg font-medium text-grey-900">{{ s.title }}</h3>
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
              <div class="h-9 w-2/5 rounded-lg bg-grey-100" />
              <div class="space-y-2">
                <div class="h-3 w-4/5 rounded bg-grey-100" />
                <div class="h-3 w-2/3 rounded bg-grey-100" />
              </div>
              <div class="h-12 w-full rounded-xl bg-grey-50" />
              <div class="h-12 w-full rounded-xl bg-grey-50" />
              <button type="button" class="mt-2 w-full rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white transition hover:bg-primary-600">
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
