<template>
  <section class="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(25,184,32,0.16),transparent_35%),linear-gradient(180deg,#f9fafb_0%,#ffffff_100%)] px-5 py-6 sm:px-6">
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
