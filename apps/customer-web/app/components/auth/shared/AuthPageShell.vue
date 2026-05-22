<template>
  <section class="min-h-screen bg-[linear-gradient(180deg,#f7fbf7_0%,#ffffff_100%)] px-5 py-6 sm:px-6">
    <div class="mx-auto flex 7xl items-start">
      <NuxtLink to="/" aria-label="GoSource home">
        <slot name="logo" />
      </NuxtLink>
    </div>

    <div class="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center">
      <slot />
    </div>
  </section>
</template>
