<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

withDefaults(
  defineProps<{
    products: MarketProduct[];
    percentageBadgeOnly?: boolean;
    keyPrefix?: string;
    /** Override card corner radius (default 8px). */
    cardRoundedClass?: string;
  }>(),
  {
    percentageBadgeOnly: false,
    keyPrefix: '',
    cardRoundedClass: 'rounded-[8px]',
  },
);
</script>

<template>
  <div class="explore-products-grid">
    <ExploreProductCard
      v-for="product in products"
      :key="`${keyPrefix}${product.id}`"
      :product="product"
      :percentage-badge-only="percentageBadgeOnly"
      :rounded-class="cardRoundedClass"
    />
  </div>
</template>

<style scoped>
.explore-products-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (min-width: 900px) {
  .explore-products-grid {
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
