<script setup lang="ts">
import { Button } from '@gosource/ui';
import type { MarketProduct } from '~/lib/marketplace-data';
import MarketProductDetailSlideModal from '~/components/market/MarketProductDetailSlideModal.vue';

definePageMeta({
  layout: false,
});

const modalOpen = ref(false);

/** Reference product from design (Beansz / Common unit). */
const sampleProduct: MarketProduct = {
  id: 'modal-test-beansz',
  name: 'Beansz product',
  brandLabel: 'Beansz',
  description: 'no description',
  imageUrl:
    'https://images.unsplash.com/photo-1599599810769-313c8c5e6a2c?auto=format&fit=crop&w=900&q=80',
  priceNaira: 900,
  compareAtNaira: 1000,
  inStock: true,
  unitChoices: [
    {
      name: 'Common',
      measure: '',
      priceNaira: 1000,
      discountedPriceNaira: 900,
    },
  ],
};

const multiUnitProduct: MarketProduct = {
  id: 'modal-test-apple',
  name: 'Green Apple',
  brandLabel: 'GoSource Fresh',
  description:
    'Crisp fresh apples for salads, smoothies, lunch packs, and daily kitchen prep.',
  longDescription:
    'Crisp fresh apples for salads, smoothies, lunch packs, and daily kitchen prep.',
  imageUrl:
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80',
  priceNaira: 2000,
  compareAtNaira: 2400,
  discountPct: 17,
  inStock: true,
  unitChoices: [
    { name: 'Kilogram', measure: 'kg', priceNaira: 2000, discountedPriceNaira: 1800 },
    { name: 'Gram', measure: 'g', priceNaira: 240 },
    { name: 'Pack', measure: 'pack', priceNaira: 1200 },
    { name: 'Pieces', measure: 'pc', priceNaira: 300 },
  ],
};

const activeProduct = ref<MarketProduct>(sampleProduct);

function openModal(product: MarketProduct) {
  activeProduct.value = product;
  modalOpen.value = true;
}
</script>

<template>
  <main class="min-h-screen bg-[#f7fbf7] px-4 py-8 text-grey-900 sm:px-6 lg:px-10">
    <section class="mx-auto flex max-w-3xl flex-col gap-8">
      <div class="flex flex-col gap-3">
        <p class="text-sm font-semibold uppercase text-primary-500">
          Modal test page
        </p>
        <h1 class="font-display text-3xl font-semibold leading-tight text-grey-900 sm:text-4xl">
          Product details slide modal
        </h1>
        <p class="max-w-2xl text-sm leading-6 text-grey-300 sm:text-base">
          Right-side panel at <code class="text-grey-900">420px</code> width,
          90% viewport height with a floating inset from the screen edge, slides in from the right.
          Column order: brand title, add to list, image, description, units, total,
          then footer quantity strip and add to cart.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <Button
          size="medium"
          class="!h-11 !rounded-full !text-sm"
          type="button"
          @click="openModal(sampleProduct)"
        >
          Open Beansz sample
        </Button>
        <Button
          size="medium"
          variant="neutral"
          class="!h-11 !rounded-full !text-sm"
          type="button"
          @click="openModal(multiUnitProduct)"
        >
          Open multi-unit sample
        </Button>
      </div>
    </section>

    <MarketProductDetailSlideModal
      v-model:open="modalOpen"
      :product="activeProduct"
    />
  </main>
</template>
