<script setup lang="ts">
import type { ExploreCategorySection } from "~/lib/explore-catalog-filters";
import { exploreCategoryInitial } from "~/lib/explore-catalog-filters";
import ExploreProductCard from "~/components/explore/ExploreProductCard.vue";
import MarketProductImage from "~/components/market/MarketProductImage.vue";

const props = defineProps<{
  section: ExploreCategorySection;
}>();

const categoryDescription = computed(() => {
  const description = props.section.sectionDescription?.trim();
  if (description) {
    return description;
  }

  return props.section.sectionTitle?.trim() || "";
});
</script>

<template>
  <section
    :id="`explore-section-${section.id}`"
    :data-category-id="section.id"
    class="scroll-mt-[4rem] border-b border-grey-50/80 pb-12 pt-4 last:border-b-0"
  >
    <header class="mb-6 flex items-start gap-3.5">
      <div
        class="relative size-14 shrink-0 overflow-hidden rounded-xl border border-grey-50/80 bg-[#FFF0EB] shadow-sm"
      >
        <MarketProductImage
          v-if="section.imageUrl"
          :src="section.imageUrl"
          :alt="section.title"
          :hover-zoom="false"
          logo-class="h-9 w-9"
        />
        <span
          v-else
          class="flex size-full items-center justify-center text-lg font-bold text-[#E85D4C]"
          aria-hidden="true"
        >
          {{ exploreCategoryInitial(section.title) }}
        </span>
      </div>

      <div class="min-w-0 flex-1 pt-0.5">
        <h2
          class="text-[1.05rem] font-medium tracking-tight text-grey-900 sm:text-[1.16rem]"
        >
          {{ section.title }}
        </h2>
        <p
          v-if="categoryDescription"
          class="mt-1 text-sm leading-relaxed text-grey-300"
        >
          {{ categoryDescription }}
        </p>
      </div>
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
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .explore-products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .explore-products-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
