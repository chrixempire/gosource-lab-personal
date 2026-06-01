<script setup lang="ts">
import type { ExploreCategorySection } from '~/lib/explore-catalog-filters';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

defineProps<{
  section: ExploreCategorySection;
}>();
</script>

<template>
  <section
    :id="`explore-section-${section.id}`"
    :data-category-id="section.id"
    class="scroll-mt-[4rem] border-b border-grey-50/80 pb-0 pt-0 last:border-b-0"
  >
    <header class="mb-3">
      <h2 class="min-w-0 truncate text-base font-semibold text-grey-900 sm:text-lg min-[900px]:text-xl">
        {{ section.title }}
      </h2>
    </header>

    <div class="explore-products-grid">
      <ExploreProductCard
        v-for="product in section.products"
        :key="product.id"
        :product="product"
      />
    </div>
  </section>
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
