<script setup lang="ts">
// Our vision — copy left, portrait photo right (Figma 891:12279).
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container grid items-start gap-12 lg:grid-cols-[minmax(0,31.1875rem)_1fr] lg:gap-32">
      <div v-reveal class="flex flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Our vision</span>
        <div class="flex flex-col gap-2">
          <h2 class="text-h1 text-grey-900">
            Revolutionizing food sourcing across Africa
          </h2>
          <p class="text-base leading-6 tracking-[-0.0125em] text-grey-700">
            Over 50 Lagos businesses already rely on GoSource—and we're just
            getting started. We're expanding across Nigeria, making food sourcing
            easier, faster, and fairer. By streamlining supply chains and reducing
            waste, we're building a smarter, greener food system for everyone.
          </p>
        </div>
      </div>

      <div
        v-reveal="120"
        class="group mx-auto h-[20rem] w-full max-w-[32.0625rem] overflow-hidden rounded-2xl sm:h-[28rem] lg:mx-0 lg:h-[38rem]"
      >
        <img
          src="/images/about/vision.png"
          alt="Workers loading crates of fresh produce for delivery"
          class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </div>
    </div>
  </section>
</template>
