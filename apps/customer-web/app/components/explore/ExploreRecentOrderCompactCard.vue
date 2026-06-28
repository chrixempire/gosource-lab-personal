<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Plus } from 'lucide-vue-next';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import { exploreProductUnitLine } from '~/lib/explore-product-display';

const props = defineProps<{
  product: MarketProduct;
}>();

const emit = defineEmits<{
  select: [product: MarketProduct];
}>();

const openAddModal = inject<(product: MarketProduct) => void>(
  'marketOpenAddModal',
  () => {},
);

function onSelect() {
  emit('select', props.product);
  openAddModal(props.product);
}
</script>

<template>
  <button
    type="button"
    data-testid="explore-recent-order-compact-card"
    class="group flex h-[72px] w-full cursor-pointer items-center gap-3 rounded-[8px] border border-grey-50 bg-background-on-canvas p-2 text-left transition-[border-color,background-color,box-shadow] duration-300 ease-out hover:border-primary-500/45 hover:shadow-[0_8px_20px_-16px_rgba(16,24,40,0.28)]"
    @click="onSelect"
  >
    <span
      class="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-grey-55"
    >
      <MarketProductImage
        :src="product.imageUrl"
        :alt="product.name"
        :hover-zoom="true"
        logo-class="w-[72%] max-w-[2.5rem]"
      />
    </span>

    <span class="min-w-0 flex-1">
      <span
        class="line-clamp-2 text-[13px] font-semibold leading-5 text-grey-900"
      >
        {{ product.name }}
      </span>
      <span
        class="mt-1 inline-flex max-w-full rounded-md bg-grey-55 px-2 py-1 text-[11px] font-medium leading-none text-grey-700"
      >
        <span class="truncate">
          {{ exploreProductUnitLine(product) }}
        </span>
      </span>
    </span>

    <span
      class="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-background-on-canvas text-grey-300 transition group-hover:border-primary-500 group-hover:text-primary-500"
      aria-hidden="true"
    >
      <Plus class="size-4" />
    </span>
  </button>
</template>
