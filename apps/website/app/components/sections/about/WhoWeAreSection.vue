<script setup lang="ts">
// Who we are — eyebrow, split headline/copy, full-width photo (Figma 891:12234).
</script>

<template>
  <section class="bg-grey-50 py-16 lg:py-24">
    <div class="site-container flex flex-col gap-12 lg:gap-20">
      <div v-reveal class="flex flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Who we are</span>
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <h2 class="max-w-[32.125rem] text-h1 text-grey-900">
            Simplifying food sourcing for business and households
          </h2>
          <p class="max-w-[28.6875rem] text-base leading-6 tracking-[0.00625em] text-grey-700 lg:pt-1">
            GoSource is a Nigerian foodtech company making bulk food sourcing
            easier for businesses and homes. Founded by industry experts in 2024,
            we blend local market insight with smart technology to eliminate the
            stress of traditional procurement.
          </p>
        </div>
      </div>

      <div
        v-reveal="120"
        class="group relative h-[20rem] overflow-hidden rounded-3xl sm:h-[28rem] lg:h-[38rem]"
      >
        <img
          src="/images/about/who.png"
          alt="GoSource team loading fresh produce at a Lagos market"
          class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </div>
    </div>
  </section>
</template>
