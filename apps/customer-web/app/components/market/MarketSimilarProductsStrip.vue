<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreMobileProductTripleGrid from '~/components/explore/ExploreMobileProductTripleGrid.vue';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

defineProps<{
  products: MarketProduct[];
  flush?: boolean;
}>();

const mobileGridRef = ref<InstanceType<typeof ExploreMobileProductTripleGrid> | null>(null);
</script>

<template>
  <div
    v-if="products.length"
    :class="[
      'space-y-3 pt-4',
      flush ? '' : 'border-t border-grey-50',
    ]"
  >
    <header class="flex items-center justify-between gap-2">
      <h3 class="min-w-0 truncate text-base font-semibold text-grey-900">
        Similar products
      </h3>

      <div v-if="mobileGridRef?.canScroll" class="flex shrink-0 gap-1 min-[900px]:hidden">
        <button
          type="button"
          class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!mobileGridRef?.canScrollLeft"
          aria-label="Scroll similar products left"
          @click="mobileGridRef?.scrollByDirection(-1)"
        >
          <ChevronLeft class="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!mobileGridRef?.canScrollRight"
          aria-label="Scroll similar products right"
          @click="mobileGridRef?.scrollByDirection(1)"
        >
          <ChevronRight class="size-5" aria-hidden="true" />
        </button>
      </div>
    </header>

    <ExploreMobileProductTripleGrid
      ref="mobileGridRef"
      :products="products"
      class="min-[900px]:hidden"
    />

    <div class="explore-products-grid">
      <ExploreProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>

<style scoped>
.explore-products-grid {
  display: none;
}

@media (min-width: 900px) {
  .explore-products-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (min-width: 1080px) {
  .explore-products-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1240px) {
  .explore-products-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
