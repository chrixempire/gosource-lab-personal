<script setup lang="ts">
import { Popover, PopoverContent, PopoverTrigger, SearchField } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import type { AdminProductListItem, InventoryTableMeta } from '~/types/inventory';

const PAGE_SIZE = 50;

const emit = defineEmits<{
  select: [product: AdminProductListItem];
}>();

const open = ref(false);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);

const products = ref<AdminProductListItem[]>([]);
const meta = ref<InventoryTableMeta | null>(null);
const currentPage = ref(1);
const pending = ref(false);
const loadingMore = ref(false);
const lastFetchedSearch = ref<string | null>(null);

const activeSearch = computed(() => debouncedSearch.value.trim());
const hasMore = computed(() => meta.value?.hasNext === true);

function mergeProducts(existing: AdminProductListItem[], incoming: AdminProductListItem[]) {
  const seen = new Set(existing.map((row) => row.id));
  const merged = [...existing];
  for (const row of incoming) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push(row);
    }
  }
  return merged;
}

async function fetchProducts(page: number, append: boolean) {
  const searchTerm = activeSearch.value;

  if (append) {
    loadingMore.value = true;
  } else {
    pending.value = true;
  }

  try {
    const payload = await $fetch<unknown>('/api/products/filtered', {
      query: {
        page,
        limit: PAGE_SIZE,
        ...(searchTerm ? { name: searchTerm } : {}),
      },
    });

    const parsed = parseFilteredProductsResponse(payload, page, PAGE_SIZE);
    currentPage.value = page;
    meta.value = parsed.meta;
    lastFetchedSearch.value = searchTerm;
    products.value = append ? mergeProducts(products.value, parsed.rows) : parsed.rows;
  } catch {
    if (!append) {
      products.value = [];
      meta.value = null;
    }
  } finally {
    pending.value = false;
    loadingMore.value = false;
  }
}

function onOpenChange(nextOpen: boolean) {
  open.value = nextOpen;
  if (nextOpen) {
    void fetchProducts(1, false);
  }
}

function onSelect(product: AdminProductListItem) {
  emit('select', product);
  searchQuery.value = '';
  open.value = false;
}

function loadMore() {
  if (!hasMore.value || pending.value || loadingMore.value) {
    return;
  }
  void fetchProducts(currentPage.value + 1, true);
}

watch(debouncedSearch, (term) => {
  if (!open.value) {
    return;
  }
  if (term === lastFetchedSearch.value) {
    return;
  }
  void fetchProducts(1, false);
});
</script>

<template>
  <!-- shadcn-vue Popover (@gosource/ui) — flips up/down based on viewport space -->
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <div class="w-full">
        <SearchField
          v-model="searchQuery"
          placeholder="Search items"
          @focus="open = true"
        />
      </div>
    </PopoverTrigger>

    <PopoverContent
      align="start"
      :side-offset="4"
      :collision-padding="12"
      class="w-[var(--reka-popover-trigger-width)] overflow-hidden p-0"
      @open-auto-focus.prevent
      @close-auto-focus.prevent
    >
      <div class="max-h-52 overflow-y-auto py-1">
        <p v-if="pending && products.length === 0" class="px-4 py-3 text-sm text-grey-500">
          Loading products…
        </p>
        <button
          v-for="item in products"
          :key="item.id"
          type="button"
          class="flex w-full cursor-pointer px-4 py-2 text-left text-sm font-medium text-grey-900 transition-colors hover:bg-grey-55"
          @mousedown.prevent="onSelect(item)"
        >
          {{ item.name }}
        </button>
        <p
          v-if="!pending && !loadingMore && products.length === 0"
          class="px-4 py-3 text-center text-sm text-grey-500"
        >
          No products found
        </p>
      </div>

      <div
        v-if="hasMore"
        class="border-t border-grey-50 px-3 py-2 text-center"
      >
        <button
          type="button"
          class="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loadingMore || pending"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading more…' : 'Load more' }}
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
