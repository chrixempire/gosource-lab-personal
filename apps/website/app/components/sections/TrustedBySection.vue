<script setup lang="ts">
// The combined logo strip is shown twice on small screens for a seamless marquee.
</script>

<template>
  <section class="bg-white py-16 lg:py-20">
    <div class="site-container">
      <h2 v-reveal class="text-center font-display text-xl font-medium text-grey-900 sm:text-2xl">
        Trusted by 50+ businesses across Nigeria
      </h2>

      <!-- Desktop: static centered strip -->
      <div v-reveal="120" class="mt-10 hidden justify-center md:flex">
        <img
          src="/images/partner-logos-row.png"
          alt="Logos of businesses that use GoSource"
          class="h-12 w-auto max-w-full opacity-80 transition-opacity duration-300 hover:opacity-100 lg:h-14"
        />
      </div>

      <!-- Mobile: gentle marquee -->
      <div class="marquee-mask mt-10 overflow-hidden md:hidden">
        <div class="flex w-max animate-marquee items-center gap-12">
          <img v-for="n in 2" :key="n" src="/images/partner-logos-row.png" alt="" aria-hidden="true" class="h-9 w-auto opacity-80" />
        </div>
      </div>

      <p v-reveal="180" class="mx-auto mt-12 max-w-2xl text-center text-base leading-relaxed text-grey-500">
        Join the growing community of restaurants, cafés, hotels and households
        sourcing smarter with GoSource every single day.
      </p>
    </div>
  </section>
</template>
