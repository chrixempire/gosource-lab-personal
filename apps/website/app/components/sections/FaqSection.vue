<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    /** When true, omits the #faq anchor (used on the dedicated FAQ page). */
    standalone?: boolean;
  }>(),
  { standalone: false },
);

const faqs = [
  {
    q: 'Do you offer customized or specialty items upon request?',
    a: 'Yes, we specialize in providing customized and specialty items tailored to your restaurant\'s specific needs. Feel free to inquire about any unique requirements.',
  },
  {
    q: 'What are your delivery times and shipping costs?',
    a: 'Our delivery times vary based on location and order specifics. Shipping costs are calculated based on order size. We aim for timely deliveries and competitive shipping rates.',
  },
  {
    q: 'What is your return or exchange policy if we receive damaged or incorrect items?',
    a: 'In case of damaged or incorrect items, please notify us immediately. We have a hassle-free return and exchange policy. We\'ll arrange for replacements or refunds as per your preference.',
  },
  {
    q: 'How do you handle backorders or items out of stock?',
    a: 'If an item is out of stock or on backorder, we\'ll promptly inform you and provide estimated restocking dates. You can choose to wait or make alternative arrangements.',
  },
  {
    q: 'Is there a dedicated account manager or point of contact for our restaurant?',
    a: 'Yes, we assign a dedicated account manager to each restaurant to ensure personalized service and smooth communication for all your needs.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept various payment methods, including credit/debit cards, bank transfers, and other secure online payment options for your convenience.',
  },
  {
    q: 'Can you assist with sourcing rare or hard-to-find ingredients/products?',
    a: 'Absolutely, we have extensive networks and expertise to assist in sourcing rare or hard-to-find ingredients/products. Just let us know your requirements.',
  },
  {
    q: 'What types of credit facilities do you offer for restaurants?',
    a: 'We offer diverse credit facilities, tailored to restaurant needs.',
  },
  {
    q: 'What are the eligibility criteria for obtaining a credit facility?',
    a: 'Eligibility criteria typically involve factors like credit history, business revenue, and time in operation. Our team will guide you through the specific requirements.',
  },
  {
    q: 'What is the maximum/minimum credit limit available?',
    a: 'The credit limits vary based on several factors. We assess your needs and financial situation to determine the most suitable credit limit for your restaurant.',
  },
  {
    q: 'What are the interest rates or fees associated with the credit facility?',
    a: 'Interest rates and fees depend on the type of credit facility and individual circumstances. Our team will provide transparent information on rates and fees applicable to your chosen facility.',
  },
  {
    q: 'Do you offer flexible repayment options or schedules?',
    a: 'Yes, we understand the importance of flexibility. We offer various repayment options and schedules tailored to accommodate your restaurant\'s cash flow and needs.',
  },
];

const open = ref(0);

function toggle(i: number) {
  open.value = open.value === i ? -1 : i;
}
</script>

<template>
  <section :id="standalone ? undefined : 'faq'" class="bg-white py-16 lg:py-24">
    <div class="site-container flex flex-col items-center gap-12 lg:gap-[4.5rem]">
      <div v-reveal class="flex flex-col items-center gap-8 text-center">
        <span class="text-lg font-semibold leading-6 tracking-[0.03375em] text-orange-500">
          FAQ
        </span>
        <h2
          class="font-display text-[2rem] font-medium leading-[1.33] tracking-[-0.02em] text-grey-900 sm:text-[2.5rem] sm:leading-[3.25rem] lg:text-[3rem] lg:leading-[4rem]"
        >
          Frequently asked questions
        </h2>
      </div>

      <div class="flex w-full max-w-[48.9375rem] flex-col gap-2">
        <div
          v-for="(item, i) in faqs"
          :key="item.q"
          v-reveal="80 + i * 60"
          class="overflow-hidden rounded-2xl p-6 transition-colors duration-300"
          :class="open === i ? 'bg-grey-75' : 'bg-transparent'"
        >
          <button
            type="button"
            class="flex w-full items-start justify-between gap-6 text-left"
            :aria-expanded="open === i"
            @click="toggle(i)"
          >
            <span
              class="font-display text-xl font-medium leading-[1.875rem] tracking-[-0.015em] transition-colors duration-300"
              :class="open === i ? 'text-grey-900' : 'text-grey-700'"
            >
              {{ item.q }}
            </span>
            <Icon
              :name="open === i ? 'lucide:minus' : 'lucide:plus'"
              class="mt-1 size-5 shrink-0 transition-all duration-300"
              :class="open === i ? 'text-grey-700' : 'text-grey-500'"
            />
          </button>
          <div
            class="grid transition-all duration-300 ease-[var(--ease-spring)]"
            :class="open === i ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          >
            <div class="overflow-hidden">
              <p class="text-base leading-6 tracking-[0.00625em] text-grey-700">
                {{ item.a }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
