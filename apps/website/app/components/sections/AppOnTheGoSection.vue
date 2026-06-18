<script setup lang="ts">
const features = [
  { icon: 'lucide:coins', title: 'Wallet payments', desc: 'Pay instantly with your GoSource Wallet.' },
  { icon: 'lucide:smartphone', title: 'Browse & order anywhere', desc: 'Shop directly from your phone.' },
  { icon: 'lucide:bike', title: 'Track deliveries live', desc: 'See exactly when your supplies arrive.' },
  { icon: 'lucide:truck', title: '24 hours delivery', desc: 'We deliver immediately or procure within 24 hours.' },
];

const categories = [
  { label: 'Spices', emoji: '🌶️', bg: 'bg-orange-50' },
  { label: 'Dairy & eggs', emoji: '🥚', bg: 'bg-warning-50' },
  { label: 'Paperware', emoji: '🥤', bg: 'bg-primary-50' },
  { label: 'Packaging', emoji: '📦', bg: 'bg-wine-50' },
];
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <!-- Copy + features -->
      <div>
        <SectionHeading
          eyebrow="Built for you"
          eyebrow-class="!text-orange-500"
          title="GoSource on the go"
          max-width="28rem"
        >
          Browse products, place orders, and track deliveries on the move. With
          GoSource at your fingertips, managing food supplies has never been
          easier.
          <template #actions>
            <AppStoreBadges />
          </template>
        </SectionHeading>

        <dl class="mt-12 grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <div v-for="(f, i) in features" :key="f.title" v-reveal="i * 80" class="flex gap-3.5">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-25 text-orange-500">
              <Icon :name="f.icon" class="size-5" />
            </span>
            <div>
              <dt class="font-medium text-grey-900">{{ f.title }}</dt>
              <dd class="mt-1 text-sm leading-relaxed text-grey-500">{{ f.desc }}</dd>
            </div>
          </div>
        </dl>
      </div>

      <!-- Phone mockup -->
      <div v-reveal="120" class="flex justify-center lg:justify-end">
        <div class="relative w-[18rem] sm:w-[20rem]">
          <!-- glow -->
          <div class="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary-100/60 to-grey-50 blur-2xl" />
          <!-- device -->
          <div class="relative overflow-hidden rounded-[2.75rem] border-[10px] border-grey-900 bg-grey-900 shadow-large">
            <!-- notch -->
            <div class="absolute left-1/2 top-2.5 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-grey-900" />
            <!-- screen -->
            <div class="relative h-[34rem] overflow-hidden rounded-[2.1rem] bg-white">
              <div class="flex items-center justify-between px-4 pb-3 pt-7">
                <div class="flex items-center gap-1.5">
                  <BrandLogo :with-wordmark="false" class="[&_svg]:h-6 [&_svg]:w-auto" />
                  <span class="font-display text-base font-semibold text-supporting-900">GoSource</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="flex size-8 items-center justify-center rounded-full bg-grey-100 text-grey-600">
                    <Icon name="lucide:bell" class="size-4" />
                  </span>
                  <span class="flex items-center gap-1 rounded-full bg-primary-500 px-2.5 py-1.5 text-xs font-semibold text-white">
                    <Icon name="lucide:shopping-bag" class="size-3.5" /> 8
                  </span>
                </div>
              </div>

              <div class="px-4">
                <div class="flex items-center gap-2 rounded-xl border border-grey-200 px-3 py-2.5 text-sm text-grey-400">
                  <Icon name="lucide:search" class="size-4" /> Search for products
                </div>

                <div class="mt-5 flex justify-between">
                  <div v-for="c in categories" :key="c.label" class="flex flex-col items-center gap-1.5">
                    <span class="flex size-14 items-center justify-center rounded-2xl text-2xl" :class="c.bg">{{ c.emoji }}</span>
                    <span class="text-[0.625rem] font-medium text-grey-600">{{ c.label }}</span>
                  </div>
                </div>

                <div class="mt-5 flex items-center justify-between">
                  <p class="font-display text-base font-medium text-grey-900">Seasonings</p>
                  <span class="text-xs font-semibold text-primary-700">See all</span>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-3">
                  <div class="rounded-2xl border border-grey-100 p-2">
                    <div class="aspect-square overflow-hidden rounded-xl bg-grey-50">
                      <img src="/images/product-02.png" alt="" class="h-full w-full object-contain p-2" />
                    </div>
                    <p class="mt-1.5 line-clamp-1 text-[0.6875rem] font-medium text-grey-700">Ducros Thyme</p>
                    <p class="text-xs font-bold text-grey-900">₦4,200</p>
                  </div>
                  <div class="rounded-2xl border border-grey-100 p-2">
                    <div class="aspect-square overflow-hidden rounded-xl bg-grey-50">
                      <img src="/images/product-01.png" alt="" class="h-full w-full object-contain p-2" />
                    </div>
                    <p class="mt-1.5 line-clamp-1 text-[0.6875rem] font-medium text-grey-700">Barbecue Sauce</p>
                    <p class="text-xs font-bold text-grey-900">₦4,500</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
