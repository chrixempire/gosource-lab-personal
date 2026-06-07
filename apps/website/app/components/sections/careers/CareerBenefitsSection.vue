<script setup lang="ts">
const benefits = [
  {
    icon: 'lucide:globe-2',
    title: 'Hybrid work mode',
    desc: 'We combine remote and in-office work to give you flexibility and balance.',
  },
  {
    icon: 'lucide:clock-3',
    title: 'Flexible schedule',
    desc: 'We value results, not rigid hours. Own your time, meet your goals.',
  },
  {
    icon: 'lucide:tree-palm',
    title: 'Paid holidays',
    desc: 'Enjoy well-deserved rest with fully paid time off.',
  },
];
</script>

<template>
  <section id="open-roles" class="bg-white py-[9rem]">
    <div class="site-container flex flex-col gap-12 lg:gap-16">
      <div v-reveal class="flex w-full max-w-[28.625rem] flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Benefits</span>
        <h2 class="text-h1 text-grey-900">Why you should join us at Gosource</h2>
      </div>

      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <div
          v-for="(benefit, index) in benefits"
          :key="benefit.title"
          v-reveal="index * 120"
          class="group flex w-full flex-col gap-6 lg:max-w-[18.0625rem]"
        >
          <Icon
            :name="benefit.icon"
            class="size-10 text-orange-500 transition-transform duration-300 group-hover:scale-110"
          />
          <div class="flex flex-col gap-4">
            <h3 class="font-display text-lg font-medium tracking-[-0.0125em] text-grey-900">
              {{ benefit.title }}
            </h3>
            <p class="text-base leading-6 tracking-[-0.0125em] text-grey-700">
              {{ benefit.desc }}
            </p>
          </div>
        </div>
      </div>

      <div v-reveal="360">
        <AppButton variant="primary" size="sm" href="#open-roles">
          View open roles
          <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
        </AppButton>
      </div>
    </div>
  </section>
</template>
