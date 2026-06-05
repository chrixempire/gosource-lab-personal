<script setup lang="ts">
// Closing call-to-action.
</script>

<template>
  <section class="bg-white pb-8 pt-4 lg:pb-12">
    <div class="site-container">
      <div
        v-reveal
        class="relative overflow-hidden rounded-3xl bg-grey-50 px-6 py-16 text-center sm:px-10 lg:rounded-[2.5rem] lg:py-20"
      >
        <div class="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary-100/50 blur-3xl" />
        <div class="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-primary-100/40 blur-3xl" />

        <div class="relative mx-auto max-w-2xl">
          <span class="eyebrow">Let's go!</span>
          <h2 class="text-h1 mx-auto mt-3 max-w-xl text-grey-900">Get started for free</h2>
          <p class="mx-auto mt-4 max-w-lg text-[1.05rem] leading-relaxed text-grey-500">
            Join hundreds of businesses sourcing smarter. Create your account in
            minutes — no setup fees, no commitments.
          </p>

          <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AppButton variant="primary" size="lg" href="#">
              Get started for free
              <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
            </AppButton>
            <AppButton variant="white" size="lg" href="#">
              <Icon name="lucide:apple" class="size-5" />
              <span class="h-4 w-px bg-grey-200" />
              <Icon name="lucide:smartphone" class="size-5" />
              <span class="ml-1">Download app</span>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
