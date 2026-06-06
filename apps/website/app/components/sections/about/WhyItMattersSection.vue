<script setup lang="ts">
// Why it matters — grey section with split copy and full-width kitchen photo.
</script>

<template>
  <section class="relative overflow-hidden bg-grey-50 py-16 lg:py-24">
    <div
      class="pointer-events-none absolute -right-32 top-8 hidden size-[28rem] opacity-40 lg:block"
      aria-hidden="true"
    >
      <div class="size-full rounded-full bg-primary-100 blur-3xl" />
    </div>

    <div class="site-container relative flex flex-col gap-12 lg:gap-20">
      <div v-reveal class="flex flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Why it matters</span>
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <h2 class="max-w-[31.8125rem] text-h1 text-grey-900">
            Running a kitchen should be about cooking great foods
          </h2>
          <p class="max-w-[28.6875rem] text-base leading-6 tracking-[0.00625em] text-grey-700 lg:pt-1">
            We believe running a kitchen shouldn't mean chasing suppliers or
            battling price changes. GoSource gives you control with tools like
            buy-now-pay-later and a smart dashboard to manage orders and
            inventory—so you can focus on creating great meals, not sourcing
            stress.
          </p>
        </div>
      </div>

      <div
        v-reveal="120"
        class="group relative h-[20rem] overflow-hidden rounded-3xl sm:h-[28rem] lg:h-[38rem]"
      >
        <img
          src="/images/about/why.png"
          alt="A chef preparing food with live order insights on a tablet"
          class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </div>
    </div>
  </section>
</template>
