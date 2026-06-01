<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import ExploreProductResponsiveGrid from '~/components/explore/ExploreProductResponsiveGrid.vue';

defineProps<{
  products: MarketProduct[];
  flush?: boolean;
}>();
</script>

<template>
  <div
    v-if="products.length"
    :class="[
      'space-y-3 pt-4',
      flush ? '' : 'border-t border-grey-50',
    ]"
  >
    <h3 class="text-base font-semibold text-grey-900">
      Similar products
    </h3>

    <ExploreProductResponsiveGrid :products="products" />
  </div>
</template>
