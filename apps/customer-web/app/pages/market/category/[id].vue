<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { MarketCategory, MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { ChevronLeft, PackageOpen } from 'lucide-vue-next';
import MarketBranchSetupBanner from '~/components/market/MarketBranchSetupBanner.vue';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import MarketProductDetailSlideModal from '~/components/market/MarketProductDetailSlideModal.vue';
import MarketProductSection from '~/components/market/MarketProductSection.vue';
import ExploreCategoryFilterBar from '~/components/explore/ExploreCategoryFilterBar.vue';
import { ALL_EXPLORE_CATEGORIES_ID } from '~/lib/explore-catalog-filters';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import { useCustomerMarketService } from '~/services/market.service';

const route = useRoute();
const router = useRouter();
const { getCategory } = useCustomerMarketService();
const { categories, hydrateFromStorage, upsertCategory, findCategoryById } = useMarketCatalog();

function onSelectCategory(nextCategoryId: string) {
  if (nextCategoryId === ALL_EXPLORE_CATEGORIES_ID) {
    void navigateTo('/market');
    return;
  }
  if (nextCategoryId === categoryId.value) {
    return;
  }
  void navigateTo(`/market/category/${nextCategoryId}`);
}

hydrateFromStorage();

const categoryId = computed(() => String(route.params.id ?? ''));
const category = ref<MarketCategory | null>(null);
const cachedCategory = computed(() => (categoryId.value ? findCategoryById(categoryId.value) ?? null : null));
const categoryDetailKey = computed(() => `market-category-detail:${categoryId.value || 'missing'}`);

const { data: categoryDetailPayload, pending: loading } = await useAuthenticatedAsyncData(
  categoryDetailKey,
  async () => {
    if (!categoryId.value) {
      return {
        category: null as MarketCategory | null,
      };
    }

    const cached = findCategoryById(categoryId.value) ?? null;

    try {
      const response = await getCategory(categoryId.value, { force: !cached, quiet: Boolean(cached) });
      return {
        category: response.data ?? cached,
      };
    } catch {
      return {
        category: cached,
      };
    }
  },
  {
    fastNav: true,
    default: () => ({
      category: cachedCategory.value,
    }),
    staleAfterMs: 5 * 60 * 1000,
  },
);

watch(
  categoryId,
  (nextCategoryId) => {
    category.value = nextCategoryId ? findCategoryById(nextCategoryId) ?? null : null;
  },
  { flush: 'sync' },
);

watch(
  categoryDetailPayload,
  async (payload) => {
    const nextCategory = payload?.category ?? cachedCategory.value ?? null;

    // Ignore an older category request if it resolves after the route ID changed.
    if (nextCategory && nextCategory.id !== categoryId.value) {
      return;
    }

    category.value = nextCategory;

    if (nextCategory) {
      upsertCategory(nextCategory);
      return;
    }

    if (categoryId.value) {
      await router.replace('/market');
    }
  },
  { immediate: true },
);

useHead({
  title: computed(() => (category.value ? `${category.value.title} · Market` : 'Market')),
});

const session = useState<{
  data?: { businessId?: string | null };
} | null>('customer-session', () => null);
const hasSession = computed(() => Boolean(session.value?.data?.businessId));
const {
  clearProductModalResume,
  fetchBranchesInBackground,
  hasBranch,
  pendingResumeProduct,
} = useMarketBranchGate();

const hasProducts = computed(() => (category.value?.products?.length ?? 0) > 0);

const modalProduct = ref<MarketProduct | null>(null);

function openProductAddModal(product: MarketProduct) {
  modalProduct.value = product;
}

function onModalOpenChange(open: boolean) {
  if (!open) {
    modalProduct.value = null;
  }
}

provide('marketOpenAddModal', openProductAddModal);


watch(
  () => [hasBranch.value, pendingResumeProduct.value] as const,
  ([nextHasBranch, nextPendingProduct]) => {
    if (!nextHasBranch || !nextPendingProduct || modalProduct.value) {
      return;
    }

    modalProduct.value = nextPendingProduct;
    clearProductModalResume();
  },
);

onMounted(async () => {
  void fetchBranchesInBackground();
});
</script>

<template>
  <div data-testid="market-category-page">
    <div v-if="category" class="pb-10 pt-0">
      <ExploreCategoryFilterBar
        :categories="categories"
        :active-category-id="categoryId"
        hide-filters
        @select-category="onSelectCategory"
      />

      <MarketBranchSetupBanner />

      <div class="mb-3 mt-2 flex items-center gap-2">
        <Button
          variant="neutral"
          size="small"
          class="!w-auto"
          :left-icon="ChevronLeft"
          @click="navigateTo('/market')"
        >
          Back
        </Button>

        <div class="flex min-w-0 items-center gap-2">
          <span
            class="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            <img
              v-if="category.imageUrl"
              :src="category.imageUrl"
              :alt="category.title"
              class="size-6 rounded-[4px] object-contain"
            >
            <span v-else-if="category.emoji" class="text-xl leading-none">
              {{ category.emoji }}
            </span>
          </span>
          <h1 class="min-w-0 truncate text-base font-semibold text-grey-900 sm:text-lg">
            {{ category.title }}
          </h1>
        </div>
      </div>

      <MarketProductSection v-if="hasProducts" :category="category" layout="grid" />

      <div
        v-else
        class="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center"
      >
        <span
          class="flex size-16 items-center justify-center rounded-full bg-grey-55 text-grey-300"
          aria-hidden="true"
        >
          <PackageOpen class="size-12" />
        </span>
        <h2 class="text-base font-semibold text-grey-900">
          No products in this category yet
        </h2>
        <p class="max-w-sm text-sm text-grey-300">
          There are currently no products available under {{ category.title }}. Check back soon or explore other categories.
        </p>
      </div>
    </div>

    <div
      v-else-if="loading"
      class="flex flex-col items-center justify-center gap-2 py-20 text-center"
    >
      <p class="text-sm font-medium text-grey-900">
        Loading category…
      </p>
      <p class="max-w-xs text-xs text-grey-300">
        Fetching the latest category products.
      </p>
    </div>

    <div
      v-else
      class="py-16 text-center text-sm text-grey-300"
    >
      We couldn’t find this category right now.
    </div>

    <MarketProductDetailSlideModal
      :open="Boolean(modalProduct)"
      :product="modalProduct"
      @update:open="onModalOpenChange"
    />
  </div>
</template>
