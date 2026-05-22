<script setup lang="ts">
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import type { MarketSearchResults } from '~/lib/market-search';
import type { MarketCategory } from '~/lib/marketplace-data';

defineProps<{
  results: MarketSearchResults;
  hasResults: boolean;
  showEmpty: boolean;
}>();

const emit = defineEmits<{
  selectCategory: [category: MarketCategory];
  selectProduct: [productId: string];
}>();
</script>

<template>
  <div class="w-full">
    <p
      v-if="showEmpty && !hasResults"
      class="px-3 py-6 text-center text-sm text-grey-400"
    >
      No categories or products found.
    </p>

    <template v-else-if="hasResults">
      <section v-if="results.categories.length" class="w-full pb-1">
        <p class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-grey-400">
          Categories
        </p>
        <ul class="w-full">
          <li
            v-for="category in results.categories"
            :key="`cat-${category.id}`"
            class="w-full"
          >
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-grey-55"
              @click="emit('selectCategory', category)"
            >
              <span
                class="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grey-55 text-lg"
              >
                <img
                  v-if="category.imageUrl"
                  :src="category.imageUrl"
                  :alt="category.title"
                  class="size-full object-cover"
                />
                <span v-else aria-hidden="true">{{ category.emoji }}</span>
              </span>
              <span class="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span class="w-full truncate text-sm font-semibold text-grey-900">
                  {{ category.title }}
                </span>
                <span class="w-full truncate text-xs text-grey-400">
                  {{ category.products.length }}
                  {{ category.products.length === 1 ? 'product' : 'products' }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="results.products.length"
        class="w-full"
        :class="results.categories.length ? 'border-t border-grey-50 pt-1' : ''"
      >
        <p class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-grey-400">
          Products
        </p>
        <ul class="w-full">
          <li
            v-for="{ product, category } in results.products"
            :key="`prod-${product.id}`"
            class="w-full"
          >
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-grey-55"
              @click="emit('selectProduct', product.id)"
            >
              <div class="relative size-11 shrink-0 overflow-hidden rounded-lg bg-grey-55">
                <MarketProductImage
                  :src="product.imageUrl"
                  :alt="product.name"
                  :hover-zoom="false"
                  logo-class="w-[70%] max-w-[2.5rem]"
                />
              </div>
              <span class="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span class="w-full truncate text-sm font-semibold text-grey-900">
                  {{ product.name }}
                </span>
                <span class="w-full truncate text-xs text-grey-400">
                  {{ category.title }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
