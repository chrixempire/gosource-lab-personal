<script setup lang="ts">
import CustomerThemeToggle from '~/components/layout/customer/CustomerThemeToggle.vue';
</script>

<template>
  <section class="customer-shell-bg relative min-h-screen px-5 py-6 pb-14 text-grey-900 transition-[background,color] duration-300 sm:px-6">
    <div class="absolute right-5 top-6 z-20 sm:right-6">
      <CustomerThemeToggle />
    </div>

    <div class="mx-auto flex items-start">
      <NuxtLink to="/" aria-label="GoSource home">
        <slot name="logo" />
      </NuxtLink>
    </div>

    <div class="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center">
      <slot />
    </div>

    <div
      class="fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 border-t border-grey-50 bg-background-on-canvas/95 py-2 backdrop-blur-sm transition-colors duration-300"
    >
      <NuxtLink
        to="/market"
        class="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-grey-900 underline-offset-4 transition hover:text-primary-500 hover:underline"
      >
        Explore our market here
        <span aria-hidden="true" class="text-primary-500 transition-transform group-hover:translate-x-0.5">→</span>
      </NuxtLink>
    </div>
  </section>
</template>
