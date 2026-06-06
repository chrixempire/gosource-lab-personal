<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'about' | 'careers';
  }>(),
  { variant: 'default' },
);
</script>

<template>
  <!-- Careers page — grey-50 centered CTA (Figma 891:12054) -->
  <section v-if="variant === 'careers'" class="bg-grey-50 py-16 lg:py-24">
    <div class="site-container">
      <div v-reveal class="mx-auto flex max-w-[40.5rem] flex-col items-center gap-8 text-center">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Let's go!</span>
        <div class="flex flex-col gap-2">
          <h2 class="text-display text-grey-900">Get started for free</h2>
          <p class="mx-auto max-w-[29.125rem] text-base leading-6 tracking-[0.00625em] text-grey-700">
            Start ordering on GoSource today to make the process of buying food items
            very easy for your business.
          </p>
        </div>
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <AppButton variant="primary" size="lg" href="#">
            Get started for free
            <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
          <AppButton variant="white" size="lg" href="#">
            <Icon name="lucide:apple" class="size-4" />
            <span class="h-2.5 w-px bg-grey-200" />
            <Icon name="lucide:smartphone" class="size-4" />
            <span class="ml-1">Download app</span>
          </AppButton>
        </div>
      </div>
    </div>
  </section>

  <!-- About page — flat centered CTA (Figma 891:12325) -->
  <section v-else-if="variant === 'about'" class="bg-white py-16 lg:py-24">
    <div class="site-container">
      <div v-reveal class="mx-auto flex max-w-[40.5rem] flex-col items-center gap-8 text-center">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Let's go!</span>
        <div class="flex flex-col gap-2">
          <h2 class="text-display text-grey-900">Get started for free</h2>
          <p class="mx-auto max-w-[29.125rem] text-base leading-6 tracking-[0.00625em] text-grey-700">
            Start ordering on GoSource today to make the process of buying food items
            very easy for your business.
          </p>
        </div>
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <AppButton variant="primary" size="lg" href="#">
            Get started for free
            <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
          <AppButton variant="white" size="lg" href="#">
            <Icon name="lucide:apple" class="size-4" />
            <span class="h-2.5 w-px bg-grey-200" />
            <Icon name="lucide:smartphone" class="size-4" />
            <span class="ml-1">Download app</span>
          </AppButton>
        </div>
      </div>
    </div>
  </section>

  <!-- Homepage — card-style CTA -->
  <section v-else class="bg-white pb-8 pt-4 lg:pb-12">
    <div class="site-container">
      <div
        v-reveal
        class="relative overflow-hidden rounded-3xl bg-grey-50 px-6 py-16 text-center sm:px-10 lg:rounded-[2.5rem] lg:py-20"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary-100/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-primary-100/40 blur-3xl"
          aria-hidden="true"
        />

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
