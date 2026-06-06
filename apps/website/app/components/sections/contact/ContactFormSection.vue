<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  message: '',
});

const inputClass =
  'h-14 w-full rounded-xl border border-grey-200 bg-white px-4 text-sm text-grey-900 outline-none transition-shadow placeholder:text-grey-500 focus:border-primary-300 focus:shadow-[0_0_0_3px_rgba(25,184,32,0.12)]';

function handleSubmit() {
  // Placeholder — wire to support endpoint when available.
  form.name = '';
  form.email = '';
  form.message = '';
}
</script>

<template>
  <section class="relative bg-white py-16 lg:py-24">
    <div
      class="site-container grid items-start gap-12 lg:grid-cols-[minmax(0,24.4375rem)_1fr] lg:gap-16 xl:justify-between"
    >
      <div v-reveal class="flex max-w-[24.4375rem] flex-col gap-8">
        <span class="text-lg font-semibold leading-6 tracking-[0.36px] text-orange-500">
          Contact us
        </span>
        <div class="flex flex-col gap-4">
          <h2
            class="font-display text-[2rem] font-medium leading-[1.33] tracking-[-0.02em] text-grey-900 sm:text-[2.5rem] sm:leading-[3.25rem] lg:text-[3rem] lg:leading-[4rem]"
          >
            Let's talk about your food sourcing needs
          </h2>
          <p class="text-base leading-6 tracking-[0.00625em] text-grey-700">
            Fill out the form and we'll get back to you within one business day. Whether
            you're curious about our pricing, need help with an order, or have a special
            request, we're all ears.
          </p>
        </div>
      </div>

      <form
        v-reveal="120"
        class="flex w-full max-w-[41.0625rem] flex-col gap-8 lg:justify-self-end"
        @submit.prevent="handleSubmit"
      >
        <div class="grid gap-8 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label for="contact-name" class="text-sm leading-[1.3125rem] tracking-[-0.0125em] text-grey-700">
              Name
            </label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              required
              placeholder="Enter your name"
              :class="inputClass"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="contact-email" class="text-sm leading-[1.3125rem] tracking-[-0.0125em] text-grey-700">
              Email
            </label>
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              required
              placeholder="Enter your email"
              :class="inputClass"
            />
          </div>
        </div>

        <div class="flex min-h-40 flex-col gap-2">
          <label for="contact-message" class="text-sm leading-[1.3125rem] tracking-[-0.0125em] text-grey-700">
            Message
          </label>
          <textarea
            id="contact-message"
            v-model="form.message"
            required
            placeholder="Enter your message"
            class="min-h-40 flex-1 resize-y rounded-xl border border-grey-200 bg-white px-4 py-4 text-sm text-grey-900 outline-none transition-shadow placeholder:text-grey-500 focus:border-primary-300 focus:shadow-[0_0_0_3px_rgba(25,184,32,0.12)]"
          />
        </div>

        <AppButton variant="primary" size="sm" type="submit">
          Talk to our team
          <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
        </AppButton>
      </form>
    </div>
  </section>
</template>
