<script setup lang="ts">
const email = ref('');

function handleSubmit() {
  // Placeholder — wire to newsletter provider when available.
  email.value = '';
}
</script>

<template>
  <section class="bg-supporting-900 py-20 lg:py-44">
    <div class="site-container">
      <div v-reveal class="mx-auto flex max-w-[36.3125rem] flex-col items-center gap-8 text-center">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-200">Newsletter</span>
        <h2 class="text-h1 text-balance text-white">Never miss an update, subscribe with us</h2>

        <form
          class="flex w-full max-w-none flex-col gap-4 sm:max-w-[36.3125rem] sm:flex-row sm:items-center"
          @submit.prevent="handleSubmit"
        >
          <label class="sr-only" for="career-newsletter-email">Email address</label>
          <input
            id="career-newsletter-email"
            v-model="email"
            type="email"
            required
            placeholder="Enter your mail"
            class="h-14 w-full rounded-xl border border-grey-200 bg-white px-4 text-sm text-grey-900 outline-none transition-shadow placeholder:text-grey-500 focus:border-primary-300 focus:shadow-[0_0_0_3px_rgba(25,184,32,0.12)]"
          />
          <AppButton variant="white" size="md" type="submit" block class="sm:w-auto sm:shrink-0">
            Get started
            <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
        </form>
      </div>
    </div>
  </section>
</template>
