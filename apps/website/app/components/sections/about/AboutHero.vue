<script setup lang="ts">
const heroImages = [
  { src: '/images/about/hero-1.png', alt: 'Fresh peppers and produce' },
  { src: '/images/about/hero-2.png', alt: 'Colorful market vegetables' },
  { src: '/images/about/hero-3.png', alt: 'Farm-fresh ingredients' },
];
</script>

<template>
  <section class="relative overflow-hidden bg-orange-25">
    <div
      class="site-container relative grid items-center gap-12 py-14 lg:min-h-[45.8125rem] lg:grid-cols-[minmax(0,28.625rem)_1fr] lg:gap-16 lg:py-0"
    >
      <div v-reveal class="relative z-10 lg:py-24">
        <h1 class="text-display text-grey-900">
          Transforming Africa's Food Supply with Technology
        </h1>
        <p class="mt-6 max-w-md text-xl leading-[1.5] tracking-[-0.015em] text-grey-700">
          We utilise cutting-edge technology to automate and enhance Africa's
          food supply chain.
        </p>
      </div>

      <!-- Desktop — infinite vertical produce scroll -->
      <div
        v-reveal="120"
        class="relative hidden min-h-[24rem] lg:block lg:min-h-[45.8125rem]"
      >
        <div class="vmask absolute inset-y-0 right-0 w-full max-w-[26.75rem] overflow-hidden">
          <div class="animate-vscroll flex flex-col gap-8">
            <template v-for="copy in 2" :key="copy">
              <div
                v-for="(image, index) in heroImages"
                :key="`${copy}-${index}`"
                class="h-[24.5625rem] shrink-0 overflow-hidden rounded-2xl border-2 border-grey-50 bg-[#fadcd6]"
              >
                <img
                  :src="image.src"
                  :alt="copy === 1 ? image.alt : ''"
                  :aria-hidden="copy !== 1 ? 'true' : undefined"
                  class="size-full object-cover"
                />
              </div>
            </template>
          </div>
        </div>

        <div
          class="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-orange-25 to-transparent"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-orange-25 to-transparent"
          aria-hidden="true"
        />
      </div>

      <!-- Mobile — static stacked preview -->
      <div v-reveal="120" class="flex flex-col gap-4 lg:hidden">
        <div
          v-for="image in heroImages.slice(0, 2)"
          :key="image.src"
          class="h-48 overflow-hidden rounded-2xl border-2 border-grey-50 bg-[#fadcd6] sm:h-56"
        >
          <img :src="image.src" :alt="image.alt" class="size-full object-cover" />
        </div>
      </div>
    </div>
  </section>
</template>
