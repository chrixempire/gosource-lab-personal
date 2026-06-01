<script setup lang="ts">
import type { ExploreCategorySection } from '~/lib/explore-catalog-filters';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import ExploreMobileProductTripleGrid from '~/components/explore/ExploreMobileProductTripleGrid.vue';
import ExploreProductCard from '~/components/explore/ExploreProductCard.vue';

const props = defineProps<{
  section: ExploreCategorySection;
}>();

const mobileGridRef = ref<InstanceType<typeof ExploreMobileProductTripleGrid> | null>(null);
</script>

<template>
  <section
    :id="`explore-section-${section.id}`"
    :data-category-id="section.id"
    class="scroll-mt-[4rem] border-b border-grey-50/80 pb-0 pt-0 last:border-b-0"
  >
    <header class="mb-3 flex items-center justify-between gap-2">
      <h2 class="min-w-0 truncate text-base font-semibold text-grey-900 sm:text-lg min-[900px]:text-xl">
        {{ section.title }}
      </h2>

      <div v-if="mobileGridRef?.canScroll" class="flex shrink-0 gap-1 min-[900px]:hidden">
        <button
          type="button"
          class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!mobileGridRef?.canScrollLeft"
          :aria-label="`Scroll ${section.title} left`"
          @click="mobileGridRef?.scrollByDirection(-1)"
        >
          <ChevronLeft class="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="customer-control-btn flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm"
          :disabled="!mobileGridRef?.canScrollRight"
          :aria-label="`Scroll ${section.title} right`"
          @click="mobileGridRef?.scrollByDirection(1)"
        >
          <ChevronRight class="size-5" aria-hidden="true" />
        </button>
      </div>
    </header>

    <ExploreMobileProductTripleGrid
      ref="mobileGridRef"
      :products="section.products"
      class="min-[900px]:hidden"
    />

    <div class="explore-products-grid">
      <ExploreProductCard
        v-for="product in section.products"
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
