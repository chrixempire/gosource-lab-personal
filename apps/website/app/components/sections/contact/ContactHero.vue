<script setup lang="ts">
// Contact hero — image flush to section bottom (Figma 891:12078).
</script>

<template>
  <section class="relative bg-orange-25">
    <div class="site-container flex flex-col items-center pt-14 sm:pt-16 lg:pt-[8.125rem]">
      <div
        v-reveal
        class="mx-auto flex max-w-[42rem] flex-col items-center gap-6 text-center"
      >
        <h1
          class="font-display text-[2.5rem] font-semibold leading-none tracking-[-0.02em] text-grey-900 sm:text-[3.5rem] lg:text-[4.5rem]"
        >
          We're here to help
        </h1>
        <p
          class="max-w-[33.875rem] text-base leading-[1.875rem] tracking-[-0.015em] text-grey-700 lg:text-xl"
        >
          Have a question, need assistance, or want to learn more about how GoSource
          can boost your food business? Get in touch with our friendly team today.
        </p>
      </div>

      <div
        v-reveal="140"
        class="group relative z-10 mt-[3.75rem] w-full max-w-[56.375rem] overflow-hidden rounded-lg bg-[#fadcd6]"
      >
        <div class="relative h-52 overflow-hidden sm:h-64 lg:h-[26.125rem]">
          <img
            src="/images/contact/hero.png"
            alt="GoSource support team member helping a customer"
            class="absolute left-1/2 top-[-4rem] h-[22rem] w-[calc(100%+1.5rem)] max-w-none -translate-x-1/2 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] sm:top-[-5rem] sm:h-[28rem] lg:top-[-6.25rem] lg:h-[38.625rem] lg:w-[57.875rem]"
          />
        </div>
      </div>
    </div>
  </section>
</template>
