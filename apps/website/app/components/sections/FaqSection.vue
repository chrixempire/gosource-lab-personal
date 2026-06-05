<script setup lang="ts">
import { ref } from 'vue';

const faqs = [
  {
    q: 'How do I sign up?',
    a: 'Create a free account in under two minutes — just add your business details, verify your phone number, and you are ready to start ordering.',
  },
  {
    q: 'How do deliveries work?',
    a: 'We deliver in-stock items the same day and procure anything else within 24 hours. You can track every delivery live from the app.',
  },
  {
    q: 'How does buy now, pay later work?',
    a: 'Approved businesses get a credit line they can use at checkout, then repay weekly or monthly. No paperwork, no hidden fees.',
  },
  {
    q: 'What areas do you currently serve?',
    a: 'We currently operate across Lagos and are expanding to more cities in Nigeria. Sign up to be notified when we launch near you.',
  },
  {
    q: 'How do I fund my wallet?',
    a: 'Add money instantly via card or bank transfer to your dedicated GoSource virtual account, then pay for orders in one tap.',
  },
];

const open = ref(0);
function toggle(i: number) {
  open.value = open.value === i ? -1 : i;
}
</script>

<template>
  <section id="faq" class="bg-white py-16 lg:py-24">
    <div class="site-container">
      <SectionHeading
        eyebrow="FAQ"
        title="Frequently asked questions"
        align="center"
        max-width="40rem"
        class="mx-auto"
      />

      <div v-reveal class="mx-auto mt-12 max-w-3xl">
        <div
          v-for="(item, i) in faqs"
          :key="item.q"
          class="border-b border-grey-100"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 py-5 text-left"
            :aria-expanded="open === i"
            @click="toggle(i)"
          >
            <span class="font-display text-lg font-medium text-grey-900">{{ item.q }}</span>
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300"
              :class="open === i ? 'rotate-180 bg-primary-500 text-white' : 'bg-grey-100 text-grey-500'"
            >
              <Icon name="lucide:chevron-down" class="size-4" />
            </span>
          </button>
          <div
            class="grid transition-all duration-300 ease-[var(--ease-spring)]"
            :class="open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden">
              <p class="pb-6 pr-12 text-[0.975rem] leading-relaxed text-grey-500">{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
