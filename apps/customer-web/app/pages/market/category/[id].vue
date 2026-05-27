<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { MarketCategory, MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import MarketBranchSetupBanner from '~/components/market/MarketBranchSetupBanner.vue';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import MarketProductDetailSlideModal from '~/components/market/MarketProductDetailSlideModal.vue';
import MarketProductSection from '~/components/market/MarketProductSection.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import { useCustomerMarketService } from '~/services/market.service';

const route = useRoute();
const router = useRouter();
const { getCategory } = useCustomerMarketService();
const { hydrateFromStorage, upsertCategory, findCategoryById } = useMarketCatalog();

hydrateFromStorage();

const categoryId = computed(() => String(route.params.id ?? ''));
const category = ref<MarketCategory | null>(null);
const cachedCategory = computed(() => (categoryId.value ? findCategoryById(categoryId.value) ?? null : null));

const { data: categoryDetailPayload, pending: loading } = await useAuthenticatedAsyncData(
  'market-category-detail',
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
    watch: [categoryId],
    default: () => ({
      category: cachedCategory.value,
    }),
    staleAfterMs: 5 * 60 * 1000,
  },
);

watch(
  categoryDetailPayload,
  async (payload) => {
    const nextCategory = payload?.category ?? cachedCategory.value ?? null;
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
    <div v-if="category" class="pb-10 pt-2">
      <MarketBranchSetupBanner />

      <div class="mb-6">
        <Button
          variant="neutral"
          size="small"
          class="!w-auto"
          :left-icon="ChevronLeft"
          @click="navigateTo('/market')"
        >
          Back
        </Button>
      </div>

      <MarketProductSection :category="category" layout="grid" />
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
