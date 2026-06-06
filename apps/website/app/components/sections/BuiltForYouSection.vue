<script setup lang="ts">
// Built For You — feature grid aligned to Figma node 891:23792.
</script>

<template>
  <section id="features" class="bg-grey-50 py-16 lg:py-24">
    <div class="site-container flex flex-col gap-16 lg:gap-32">
      <div v-reveal class="flex max-w-[31.1875rem] flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">
          Built for you
        </span>

        <div class="flex flex-col gap-2">
          <h2 class="text-h1 text-grey-900">
            Run your business with zero stress
          </h2>
          <p class="text-base leading-6 text-grey-700">
            We are a food procurement, supply-chain, and logistics powerhouse that
            take responsibilities off businesses and consumers and keeps the supply
            chain running.
          </p>
        </div>

        <AppButton variant="primary" size="sm" href="#market">
          Try GoSource now
          <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
        </AppButton>
      </div>

      <div class="flex flex-col gap-10">
        <!-- Row 1 — Bulk procurement + lifestyle photo -->
        <div class="flex flex-col gap-10 lg:flex-row">
          <FeatureCard
            class="min-w-0 flex-1"
            tint="bg-wine-50"
            tag-tint="bg-wine-50"
            icon="lucide:shopping-cart"
            icon-class="text-wine-500"
            label="Bulk procurement"
            title="All food items in one store"
            cta="Explore market"
          >
            <template #mock>
              <img
                src="/images/all-food-items.png"
                alt="GoSource marketplace with bulk food items"
                class="h-full w-full object-cover object-top"
              />
            </template>
            Buy food supplies in large quantities at wholesale prices and save
            more on every order.
          </FeatureCard>

          <div
            v-reveal="100"
            class="overflow-hidden rounded-xl border border-grey-100 bg-white p-1.5 shadow-small lg:w-[23.6875rem] lg:shrink-0 lg:self-stretch"
          >
            <div class="h-[20rem] overflow-hidden rounded-lg lg:h-full lg:min-h-[35rem]">
              <img
                src="/images/shopper-food-wall.png"
                alt="Shopper browsing a wall of fresh food categories"
                class="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Row 2 — Credit + Wallet -->
        <div class="grid gap-10 lg:grid-cols-2">
          <FeatureCard
            tint="bg-primary-50"
            tag-tint="bg-primary-50"
            icon="lucide:receipt"
            icon-class="text-primary-700"
            label="Credit access"
            title="Buy now, pay later"
          >
            <template #mock>
              <img
                src="/images/buy-now-pay-later.png"
                alt="Choosing pay with credit at checkout"
                class="h-full w-full object-cover object-left-top"
              />
            </template>
            Get the supplies you need today and pay weekly or monthly — flexible
            credit that works for your business.
          </FeatureCard>

          <FeatureCard
            tint="bg-purple-50"
            tag-tint="bg-purple-50"
            icon="lucide:wallet"
            icon-class="text-purple-500"
            label="Wallet management"
            title="Track your purchases"
          >
            <template #mock>
              <img
                src="/images/track-your-purchase.png"
                alt="Wallet balance and order purchase confirmation"
                class="h-full w-full object-cover object-left-top"
              />
            </template>
            Every order, every payment — recorded for your convenience.
          </FeatureCard>
        </div>

        <!-- Row 3 — Lifestyle photo + Dashboard -->
        <div class="flex flex-col gap-10 lg:flex-row">
          <div
            v-reveal="100"
            class="order-2 overflow-hidden rounded-xl border border-grey-100 bg-white p-1.5 shadow-small lg:order-1 lg:w-[23.6875rem] lg:shrink-0 lg:self-stretch"
          >
            <div class="h-[20rem] overflow-hidden rounded-lg lg:h-full lg:min-h-[35rem]">
              <img
                src="/images/chef-dashboard.png"
                alt="Chef reviewing live dashboard insights"
                class="h-full w-full object-cover"
              />
            </div>
          </div>

          <FeatureCard
            class="order-1 min-w-0 flex-1 lg:order-2"
            tint="bg-orange-25"
            tag-tint="bg-orange-25"
            icon="lucide:bar-chart-3"
            icon-class="text-orange-500"
            label="Dashboard management"
            title="Get dashboard insights"
          >
            <template #mock>
              <img
                src="/images/get-dashboard-insight.png"
                alt="Dashboard with total amount and total orders charts"
                class="h-full w-full object-cover object-top"
              />
            </template>
            You get to see an overview of how you spend and buy products.
          </FeatureCard>
        </div>
      </div>
    </div>
  </section>
</template>
