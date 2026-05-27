<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import ExploreCategoryFilterBar from '~/components/explore/ExploreCategoryFilterBar.vue';
import ExploreCategorySection from '~/components/explore/ExploreCategorySection.vue';
import ExplorePageHero from '~/components/explore/ExplorePageHero.vue';
import ExplorePromotionsSection from '~/components/explore/ExplorePromotionsSection.vue';
import ExploreRecentOrdersSection from '~/components/explore/ExploreRecentOrdersSection.vue';
import MarketProductDetailSlideModal from '~/components/market/MarketProductDetailSlideModal.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import { useExploreScrollSpy } from '~/composables/useExploreScrollSpy';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import {
  ALL_EXPLORE_CATEGORIES_ID,
  buildExploreSections,
  mergeExploreRouteQuery,
  parseExploreFiltersFromRoute,
} from '~/lib/explore-catalog-filters';
import { categoriesWithProducts, type MarketPromotion } from '~/lib/marketplace-data';
import { readCachedCategoriesFromStorage } from '~/services/market.service';
import { useCustomerMarketService } from '~/services/market.service';

definePageMeta({
  layout: 'customer-explore',
});

const route = useRoute();
const router = useRouter();
const session = useState<{
  data?: { firstName?: string | null };
} | null>('customer-session', () => null);
const { branches, activeBranchId, hasSession } = useBusinessBranchContext();

const { categories, catalogList, hydrateFromStorage, setCategories } =
  useMarketCatalog();
const { listCategories, listPromotions, listRecentOrders } = useCustomerMarketService();

if (import.meta.client) {
  const persisted = readCachedCategoriesFromStorage({ allowStale: true }) ?? [];
  if (persisted.length > 0 && catalogList().length === 0) {
    categories.value = persisted;
  }
}
hydrateFromStorage();

const initialRouteFilters = parseExploreFiltersFromRoute(route.query);

const activeCategoryId = ref(initialRouteFilters.categoryId);
const inStockOnly = ref(initialRouteFilters.inStockOnly);
const priceMin = ref<number | null>(initialRouteFilters.priceMin);
const priceMax = ref<number | null>(initialRouteFilters.priceMax);
const modalProduct = ref<MarketProduct | null>(null);
const recentOrderProducts = ref<MarketProduct[]>([]);
const recentOrdersPending = ref(false);
const promotions = ref<MarketPromotion[]>([]);
const promotionsPending = ref(false);

let skipRouteSync = false;
let pendingRouteCategoryScroll: string | null =
  initialRouteFilters.categoryId !== ALL_EXPLORE_CATEGORIES_ID
    ? initialRouteFilters.categoryId
    : null;

function openProductAddModal(product: MarketProduct) {
  modalProduct.value = product;
}

function onModalOpenChange(open: boolean) {
  if (!open) {
    modalProduct.value = null;
  }
}

provide('marketOpenAddModal', openProductAddModal);

const { data: catalogPayload, pending: catalogPending } =
  await useAuthenticatedAsyncData(
    'market-catalog',
    async () => {
      const response = await listCategories({ force: false, quiet: true });
      return response.data ?? [];
    },
    {
      default: () => catalogList(),
    },
  );

watch(
  catalogPayload,
  (payload) => {
    if (Array.isArray(payload) && payload.length > 0) {
      setCategories(payload);
    }
  },
  { immediate: true },
);

const visibleCategories = computed(() => categoriesWithProducts(catalogList()));

const productFilters = computed(() => ({
  inStockOnly: inStockOnly.value,
  priceMin: priceMin.value,
  priceMax: priceMax.value,
}));

const exploreSections = computed(() =>
  buildExploreSections(catalogList(), productFilters.value),
);

const hasCatalog = computed(() => visibleCategories.value.length > 0);
const showRecentOrders = computed(
  () => recentOrdersPending.value || recentOrderProducts.value.length > 0,
);
const showPromotions = computed(
  () => promotionsPending.value || promotions.value.length > 0,
);

const greetingName = computed(() => {
  const first = session.value?.data?.firstName;
  return typeof first === 'string' && first.trim() ? first.trim() : 'there';
});

function formatExploreBranchLabel(branchName: string) {
  const trimmed = branchName.trim();
  if (!trimmed) {
    return 'Your branch';
  }

  if (/\bbranch$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed} branch`;
}

const outletLabel = computed(() => {
  const branch = (branches.value ?? []).find(
    (row) => row.id === activeBranchId.value,
  );
  if (branch?.branchName) {
    return formatExploreBranchLabel(branch.branchName);
  }
  return 'Your branch';
});

function syncFiltersToRoute() {
  if (skipRouteSync) {
    return;
  }

  skipRouteSync = true;

  const nextQuery = mergeExploreRouteQuery(route.query, {
    categoryId: activeCategoryId.value,
    inStockOnly: inStockOnly.value,
    priceMin: priceMin.value,
    priceMax: priceMax.value,
  });

  router.replace({ path: route.path, query: nextQuery });

  nextTick(() => {
    skipRouteSync = false;
  });
}

function applyFiltersFromRoute() {
  const parsed = parseExploreFiltersFromRoute(route.query);
  activeCategoryId.value = parsed.categoryId;
  inStockOnly.value = parsed.inStockOnly;
  priceMin.value = parsed.priceMin;
  priceMax.value = parsed.priceMax;
}

watch(
  () => route.query,
  () => {
    if (skipRouteSync) {
      return;
    }

    applyFiltersFromRoute();
  },
  { deep: true },
);

watch([activeCategoryId, inStockOnly, priceMin, priceMax], () => {
  syncFiltersToRoute();
});

const { selectCategory, attachScrollListener, detachScrollListener } =
  useExploreScrollSpy({
    sections: exploreSections,
    activeCategoryId,
  });

function onSelectCategory(categoryId: string) {
  selectCategory(categoryId);
}

function onApplyPrice(payload: {
  priceMin: number | null;
  priceMax: number | null;
}) {
  priceMin.value = payload.priceMin;
  priceMax.value = payload.priceMax;
}

async function loadRecentOrderProducts(branchId: string | null | undefined) {
  if (!import.meta.client || !hasSession.value || !branchId) {
    recentOrderProducts.value = [];
    recentOrdersPending.value = false;
    return;
  }

  recentOrdersPending.value = recentOrderProducts.value.length === 0;

  try {
    const response = await listRecentOrders(branchId, { quiet: true });
    recentOrderProducts.value = response.data ?? [];
  } catch {
    recentOrderProducts.value = [];
  } finally {
    recentOrdersPending.value = false;
  }
}

async function loadPromotions() {
  if (!import.meta.client || !hasSession.value) {
    promotions.value = [];
    promotionsPending.value = false;
    return;
  }

  promotionsPending.value = promotions.value.length === 0;

  try {
    const response = await listPromotions({ quiet: true });
    promotions.value = response.data ?? [];
  } catch {
    promotions.value = [];
  } finally {
    promotionsPending.value = false;
  }
}

function maybeScrollToRouteCategory() {
  if (!pendingRouteCategoryScroll || !hasCatalog.value) {
    return;
  }

  const targetId = pendingRouteCategoryScroll;
  pendingRouteCategoryScroll = null;

  if (!visibleCategories.value.some((category) => category.id === targetId)) {
    activeCategoryId.value = ALL_EXPLORE_CATEGORIES_ID;
    return;
  }

  nextTick(() => {
    selectCategory(targetId);
  });
}

watch(
  visibleCategories,
  () => {
    maybeScrollToRouteCategory();
  },
  { immediate: true },
);

onMounted(() => {
  nextTick(() => {
    attachScrollListener();
    maybeScrollToRouteCategory();
  });
});

if (import.meta.client) {
  watch(
    [hasSession, activeBranchId],
    ([sessionOk, branchId]) => {
      if (!sessionOk || !branchId) {
        recentOrderProducts.value = [];
        recentOrdersPending.value = false;
        promotions.value = [];
        promotionsPending.value = false;
        return;
      }

      void loadRecentOrderProducts(branchId);
      void loadPromotions();
    },
    { immediate: true },
  );
}

onActivated(() => {
  nextTick(() => {
    attachScrollListener();
  });
});

onUnmounted(() => {
  detachScrollListener();
});
</script>

<template>
  <div data-testid="market-page" class="pb-28 sm:pb-32">
    <ExplorePageHero
      :greeting-name="greetingName"
      :outlet-label="outletLabel"
    />

    <ExploreCategoryFilterBar
      v-if="hasCatalog"
      :categories="visibleCategories"
      :active-category-id="activeCategoryId"
      :in-stock-only="inStockOnly"
      :price-min="priceMin"
      :price-max="priceMax"
      @select-category="onSelectCategory"
      @update:in-stock-only="inStockOnly = $event"
      @apply-price="onApplyPrice"
    />

    <div
      v-if="catalogPending && !hasCatalog"
      class="flex flex-col items-center justify-center gap-2 py-20 text-center"
    >
      <p class="text-sm font-medium text-grey-900">Loading catalog…</p>
    </div>

    <div
      v-else-if="!hasCatalog"
      class="py-16 text-center text-sm text-grey-300"
    >
      No categories available right now.
    </div>

    <div v-else id="explore-catalog-start" class="space-y-2">
      <ExploreRecentOrdersSection
        v-if="showRecentOrders"
        :products="recentOrderProducts"
        :loading="recentOrdersPending"
        @select="openProductAddModal"
      />

      <ExplorePromotionsSection
        v-if="showPromotions"
        :promotions="promotions"
        :loading="promotionsPending"
      />

      <ExploreCategorySection
        v-for="section in exploreSections"
        :key="section.id"
        :section="section"
      />

      <p
        v-if="exploreSections.length === 0"
        class="py-16 text-center text-sm text-grey-300"
      >
        No products match your filters.
      </p>
    </div>

    <MarketProductDetailSlideModal
      :open="Boolean(modalProduct)"
      :product="modalProduct"
      @update:open="onModalOpenChange"
    />
  </div>
</template>
