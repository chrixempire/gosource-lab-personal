<script setup lang="ts">
const cards = [
  {
    icon: 'lucide:clock-3',
    title: 'Office hours',
    desc: 'Monday – Friday, 9am – 6pm (GMT+1). But our platform runs 24/7, and we often respond off-hours for urgent needs',
  },
  {
    icon: 'lucide:map-pin',
    title: 'Address',
    desc: '123 Food Hub Avenue, Ikeja, Lagos, Nigeria.',
    action: {
      label: 'View on map',
      href: 'https://maps.google.com/?q=123+Food+Hub+Avenue+Ikeja+Lagos+Nigeria',
    },
  },
  {
    icon: 'lucide:phone',
    title: 'Reach out',
    links: [
      { label: '+234 906 182 7124', href: 'tel:+2349061827124' },
      { label: 'support@gosource.app', href: 'mailto:support@gosource.app' },
    ],
  },
  {
    icon: 'lucide:smartphone',
    title: 'Follow us',
    links: [
      { label: 'Twitter', href: '#' },
      { label: 'X (Formerly twitter)', href: '#' },
      { label: 'Instagram', href: '#' },
      { label: 'LinkedIn', href: '#' },
    ],
  },
];
</script>

<template>
  <section class="bg-grey-50 py-16 lg:py-24">
    <div class="site-container flex flex-col gap-12 lg:gap-32">
      <div v-reveal class="flex flex-col gap-8">
        <span class="text-lg font-semibold leading-6 tracking-[0.36px] text-orange-500">
          Contact us
        </span>
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <h2
            class="max-w-[32.125rem] font-display text-[2rem] font-medium leading-[1.33] tracking-[-0.02em] text-grey-900 sm:text-[2.5rem] sm:leading-[3.25rem] lg:text-[3rem] lg:leading-[4rem]"
          >
            Instantaneous assistance
          </h2>
          <p class="max-w-[31.3125rem] text-base leading-6 tracking-[0.00625em] text-grey-700 lg:pt-1">
            We're committed to excellent customer service. Whether you prefer a phone call,
            an email, or a WhatsApp chat, our support team is ready to assist. No issue is
            too small – from help with signing up to tracking a delivery, consider us your
            partners in simplifying procurement.
          </p>
        </div>
      </div>

      <div class="grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-10">
        <div
          v-for="(card, index) in cards"
          :key="card.title"
          v-reveal="index * 100"
          class="group flex flex-col gap-4"
        >
          <Icon
            :name="card.icon"
            class="size-10 text-orange-500 transition-transform duration-300 group-hover:scale-110"
          />
          <div class="flex flex-col gap-2">
            <h3 class="font-display text-lg font-medium leading-[1.6875rem] tracking-[-0.0125em] text-grey-900">
              {{ card.title }}
            </h3>
            <p v-if="card.desc" class="text-sm leading-[1.3125rem] tracking-[0.00625em] text-grey-700">
              {{ card.desc }}
            </p>
          </div>
          <a
            v-if="card.action"
            :href="card.action.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-sm font-semibold leading-[0.875rem] tracking-[0.00625em] text-grey-700 transition-colors hover:text-primary-700"
          >
            {{ card.action.label }}
            <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <ul v-if="card.links" class="flex flex-col gap-4">
            <li v-for="link in card.links" :key="link.label">
              <a
                :href="link.href"
                class="font-display text-base leading-6 tracking-[-0.0125em] text-primary-500 underline decoration-primary-500/30 underline-offset-2 transition-colors hover:text-primary-700"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
