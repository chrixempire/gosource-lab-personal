<script setup lang="ts">
import { CUSTOMER_MARKET_URL } from '~/lib/customer-app';
// Dark-green focus band with the large market lifestyle photo.
</script>

<template>
  <section class="relative overflow-hidden bg-supporting-900">
    <div class="site-container py-16 lg:py-24">
      <div v-reveal class="mx-auto max-w-3xl text-center">
        <span class="eyebrow !text-primary-200">Zero stress</span>
        <h2 class="text-h1 mx-auto mt-4 max-w-2xl text-white">
          Focus more on cooking,
          <span class="text-serif-accent text-primary-300"> let's go to the market for you</span>
        </h2>
        <div class="mt-8 flex justify-center">
          <AppButton variant="primary" size="lg" :href="CUSTOMER_MARKET_URL">
            Explore market
            <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
        </div>
      </div>

      <div v-reveal="120" class="mt-14 overflow-hidden rounded-3xl shadow-large">
        <img
          src="/images/woman-smiling.jpeg"
          alt="Cooking at home with a fresh GoSource grocery haul"
          class="aspect-[16/9] w-full object-cover"
        />
      </div>
    </div>
  </section>
</template>
