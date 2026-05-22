<template>
  <section class="relative min-h-screen bg-[linear-gradient(180deg,#f7fbf7_0%,#ffffff_100%)] px-5 py-6 pb-14 sm:px-6">
    <div class="mx-auto flex items-start">
      <NuxtLink to="/" aria-label="GoSource home">
        <slot name="logo" />
      </NuxtLink>
    </div>

    <div class="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center">
      <slot />
    </div>

    <div
      class="fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 border-t border-grey-50 bg-grey-55/95 py-2 backdrop-blur-sm"
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
