<script setup lang="ts">
import type { MarketProduct } from "~/lib/marketplace-data";
import { Plus } from "lucide-vue-next";
import MarketProductImage from "~/components/market/MarketProductImage.vue";
import { exploreProductUnitLine } from "~/lib/explore-product-display";
import { formatNaira } from "~/composables/useMarketplaceCart";

const props = defineProps<{
  products: MarketProduct[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [product: MarketProduct];
}>();

const visibleProducts = computed(() => props.products.slice(0, 8));

function productUnitLabel(product: MarketProduct) {
  return (
    exploreProductUnitLine(product) ?? `${formatNaira(product.priceNaira)}`
  );
}
</script>

<template>
  <section
    v-if="loading || visibleProducts.length > 0"
    class="mb-8 mt-6"
  >
    <header class="px-1 py-1.5 sm:px-0">
      <h2 class="text-base font-semibold text-grey-900 sm:text-lg">
        Recently ordered items
      </h2>
    </header>

    <div class="pt-3">
      <div
        v-if="loading && visibleProducts.length === 0"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div
          v-for="index in 8"
          :key="index"
          class="h-[72px] animate-pulse rounded-[8px] border border-grey-50 bg-grey-55"
        />
      </div>

      <div v-else class="recent-orders-grid">
        <button
          v-for="product in visibleProducts"
          :key="product.id"
          type="button"
          class="group flex min-h-[72px] min-w-0 cursor-pointer items-center gap-3 rounded-[8px] border border-grey-50 bg-white p-2 text-left shadow-[0_10px_24px_-22px_rgba(16,24,40,0.28)] transition-[border-color,box-shadow] hover:border-primary-500/45 hover:shadow-[0_16px_30px_-24px_rgba(4,85,11,0.4)]"
          @click="emit('select', product)"
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
              class="line-clamp-1 text-[13px] font-semibold leading-5 text-grey-900"
            >
              {{ product.name }}
            </span>
            <span
              class="mt-1 inline-flex max-w-full rounded-md bg-grey-55 px-2 py-1 text-[11px] font-medium leading-none text-grey-700"
            >
              <span class="truncate">{{ productUnitLabel(product) }}</span>
            </span>
          </span>

          <span
            class="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-300 transition group-hover:border-primary-500 group-hover:text-primary-500"
            aria-hidden="true"
          >
            <Plus class="size-4" />
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.recent-orders-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .recent-orders-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1180px) {
  .recent-orders-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
