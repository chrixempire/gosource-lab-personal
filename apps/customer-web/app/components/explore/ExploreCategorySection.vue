<script setup lang="ts">
import type { ExploreCategorySection } from '~/lib/explore-catalog-filters';
import { ChevronRight } from 'lucide-vue-next';
import ExploreMobileProductTripleGrid from '~/components/explore/ExploreMobileProductTripleGrid.vue';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

const props = defineProps<{
  section: ExploreCategorySection;
}>();

const MAX_VISIBLE_PRODUCTS = 10;

const totalProducts = computed(() => props.section.products.length);
const visibleProducts = computed(() =>
  props.section.products.slice(0, MAX_VISIBLE_PRODUCTS),
);
</script>

<template>
  <section
    :id="`explore-section-${section.id}`"
    :data-category-id="section.id"
    class="scroll-mt-[4rem] border-b border-grey-50/80 pb-2 pt-0 last:border-b-0"
  >
    <header class="mb-3 flex items-center justify-between gap-3 rounded-lg bg-[#EAECF0] p-2">
      <div class="flex min-w-0 items-center gap-2 pl-2">
        <h2 class="min-w-0 truncate text-base font-semibold text-black sm:text-lg min-[900px]:text-xl">
          {{ section.title }}
        </h2>
        <span
          class="inline-flex size-[18px] shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <img
            v-if="section.imageUrl"
            :src="section.imageUrl"
            :alt="section.title"
            class="size-[18px] shrink-0 rounded-[4px] object-contain"
          >
          <span v-else-if="section.emoji" class="text-[18px] leading-none">
            {{ section.emoji }}
          </span>
        </span>
      </div>

      <NuxtLink
        :to="`/market/category/${section.id}`"
        class="flex shrink-0 cursor-pointer items-center gap-0.5 whitespace-nowrap p-1 px-2.5 text-sm font-medium text-black transition-colors hover:text-primary-500"
      >
        View all ({{ totalProducts }})
        <ChevronRight class="size-4" aria-hidden="true" />
      </NuxtLink>
    </header>

    <ExploreMobileProductTripleGrid
      :products="visibleProducts"
      class="min-[900px]:hidden"
    />

    <div class="explore-products-grid">
      <ExploreProductCard
        v-for="product in visibleProducts"
        :key="`desktop-${product.id}`"
        :product="product"
      />
    </div>
  </section>
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
