<script setup lang="ts">
// Tall lifestyle image card used in rows 1 and 3.
</script>

<template>
  <section id="features" class="bg-white py-16 lg:py-24">
    <div class="site-container">
      <SectionHeading
        eyebrow="Built for you"
        title="Run your business with zero stress"
        max-width="32rem"
      >
        We are a food procurement, supply chain, and logistics powerhouse that
        takes responsibility off your hands so you can run your business with
        complete peace of mind.
        <template #actions>
          <AppButton variant="primary" href="#market">
            Explore market
            <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
        </template>
      </SectionHeading>

      <div class="mt-14 flex flex-col gap-5 lg:gap-6">
        <!-- Row 1 — Bulk procurement + photo -->
        <div class="grid gap-5 lg:grid-cols-[1.7fr_1fr] lg:gap-6">
          <FeatureCard
            tint="bg-wine-50"
            icon="lucide:shopping-cart"
            icon-class="text-wine-500"
            pill-class="bg-white shadow-xsmall"
            label="Bulk procurement"
            title="All food items in one store"
          >
            <template #mock><MockBulk /></template>
            Buy food supplies in large quantities at wholesale prices and save
            more on every order.
            <template #cta>Explore market</template>
          </FeatureCard>

          <div v-reveal="100" class="min-h-[20rem] overflow-hidden rounded-3xl">
            <img src="/images/woman-food-festival.png" alt="Shopper choosing fresh produce" class="h-full w-full object-cover" />
          </div>
        </div>

        <!-- Row 2 — Credit + Wallet -->
        <div class="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <FeatureCard
            tint="bg-primary-50"
            icon="lucide:receipt"
            icon-class="text-primary-700"
            pill-class="bg-white shadow-xsmall"
            label="Credit access"
            title="Buy now, pay later"
          >
            <template #mock><MockPaymentMethod /></template>
            Get the supplies you need today and pay weekly or monthly — flexible
            credit that works for your business.
          </FeatureCard>

          <FeatureCard
            tint="bg-purple-50"
            icon="lucide:wallet"
            icon-class="text-purple-500"
            pill-class="bg-white shadow-xsmall"
            label="Wallet management"
            title="Track your purchases"
          >
            <template #mock><MockWallet /></template>
            Every order, every payment — recorded for your convenience.
          </FeatureCard>
        </div>

        <!-- Row 3 — Photo + Dashboard -->
        <div class="grid gap-5 lg:grid-cols-[1fr_1.7fr] lg:gap-6">
          <div v-reveal="100" class="order-2 min-h-[20rem] overflow-hidden rounded-3xl lg:order-1">
            <img src="/images/man-pineapple.png" alt="Inspecting fresh produce in store" class="h-full w-full object-cover" />
          </div>

          <FeatureCard
            class="order-1 lg:order-2"
            tint="bg-orange-25"
            icon="lucide:bar-chart-3"
            icon-class="text-orange-500"
            pill-class="bg-white shadow-xsmall"
            label="Dashboard management"
            title="Get dashboard insights"
          >
            <template #mock><MockDashboard /></template>
            You get to see an overview of how you spend and buy products across
            every branch.
          </FeatureCard>
        </div>
      </div>
    </div>
  </section>
</template>
