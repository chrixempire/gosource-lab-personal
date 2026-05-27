import type { MarketProduct, MarketPromotion } from '~/lib/marketplace-data';
import MarketCategoryRail from '~/components/market/MarketCategoryRail.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import { categoriesWithProducts } from '~/lib/marketplace-data';
import { readCachedCategoriesFromStorage } from '~/services/market.service';
import { useCustomerMarketService } from '~/services/market.service';

/**
 * Shared catalog, promotions, scroll-spy, and add-modal state for market home routes.
 * Pair modalProduct / onModalOpenChange with MarketProductDetailSlideModal (or legacy MarketProductAddModal).
 */
export async function useMarketHomePage() {
  const { hasSession } = useCustomerSession();
  const { syncMarketCartEntry } = useMarketplaceCart();
  const { categories, catalogList, hydrateFromStorage, setCategories } = useMarketCatalog();
  const { listCategories, listPromotions, listRecentOrders } = useCustomerMarketService();

  if (import.meta.client) {
    const persisted = readCachedCategoriesFromStorage({ allowStale: true }) ?? [];
    if (persisted.length > 0 && catalogList().length === 0) {
      categories.value = persisted;
    }
  }
  hydrateFromStorage();

  const {
    activeBranchId,
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

  const { data: marketCatalogPayload, pending: marketCatalogPending } =
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
    marketCatalogPayload,
    (payload) => {
      if (Array.isArray(payload) && payload.length > 0) {
        setCategories(payload);
      }
    },
    { immediate: true },
  );

  const visibleCategories = computed(() => categoriesWithProducts(catalogList()));

  const promotions = ref<MarketPromotion[]>([]);
  const recentOrderProducts = ref<MarketProduct[]>([]);
  const recentOrdersExpanded = ref(false);
  const expandedPromotionId = ref<string | null>(null);

  const visiblePromotions = computed(() =>
    promotions.value.filter((promo) => promo.products.length > 0),
  );

  const showPromotionsBlock = computed(
    () => visiblePromotions.value.length > 0 && !recentOrdersExpanded.value,
  );

  const showRecentOrdersBlock = computed(
    () =>
      hasSession.value &&
      recentOrderProducts.value.length > 0 &&
      !expandedPromotionId.value,
  );

  const showCategoryCatalog = computed(
    () => !recentOrdersExpanded.value && !expandedPromotionId.value,
  );

  const hasPersistedCatalog = computed(() => {
    if (catalogList().length > 0) {
      return true;
    }
    if (!import.meta.client) {
      return false;
    }
    return (readCachedCategoriesFromStorage({ allowStale: true }) ?? []).length > 0;
  });

  const isFetchingFirstCatalog = ref(false);

  const activeCategoryId = ref('');
  const categoryRailRef = ref<InstanceType<typeof MarketCategoryRail> | null>(null);

  let scrollSpySuspendedUntil = 0;

  function suspendScrollSpy(ms: number) {
    scrollSpySuspendedUntil = Date.now() + ms;
  }

  function updateActiveFromScroll() {
    if (Date.now() < scrollSpySuspendedUntil) {
      return;
    }

    const root = document.getElementById('customer-shell-scroll');
    if (!root) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const markerOffset =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 172 : 148;
    const marker = rootRect.top + markerOffset;
    let nextId = visibleCategories.value[0]?.id ?? '';

    for (const cat of visibleCategories.value) {
      const el = document.getElementById(`market-section-${cat.id}`);
      if (!el) {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.top <= marker) {
        nextId = cat.id;
      }
    }

    if (nextId && nextId !== activeCategoryId.value) {
      activeCategoryId.value = nextId;
      nextTick(() => {
        categoryRailRef.value?.scrollActiveIntoView();
      });
    }
  }

  function onShellScroll() {
    updateActiveFromScroll();
  }

  function scrollMarketSectionIntoView(id: string) {
    const root = document.getElementById('customer-shell-scroll');
    const el = document.getElementById(`market-section-${id}`);
    if (!root || !el) {
      return;
    }

    const offset =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 172 : 148;

    const applyScroll = () => {
      const nextTop =
        el.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        offset;
      root.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(applyScroll);
    });
  }

  function selectCategory(id: string) {
    activeCategoryId.value = id;
    suspendScrollSpy(900);
    nextTick(() => {
      scrollMarketSectionIntoView(id);
      categoryRailRef.value?.scrollActiveIntoView();
    });
  }

  let scrollListenerAttached = false;

  function attachScrollListener() {
    if (scrollListenerAttached) {
      return;
    }
    const root = document.getElementById('customer-shell-scroll');
    if (!root) {
      return;
    }
    root.addEventListener('scroll', onShellScroll, { passive: true });
    scrollListenerAttached = true;
    updateActiveFromScroll();
  }

  function detachScrollListener() {
    if (!scrollListenerAttached) {
      return;
    }
    const root = document.getElementById('customer-shell-scroll');
    root?.removeEventListener('scroll', onShellScroll);
    scrollListenerAttached = false;
  }

  watch(visibleCategories, (next) => {
    if (!next.length) {
      activeCategoryId.value = '';
      return;
    }
    if (!next.some((cat) => cat.id === activeCategoryId.value)) {
      activeCategoryId.value = next[0]!.id;
    }
  }, { immediate: true });

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

  watch(
    [activeBranchId, hasSession] as const,
    ([branchId, signedIn]) => {
      if (!signedIn) {
        recentOrderProducts.value = [];
        return;
      }
      void loadRecentOrders(branchId ?? '');
    },
    { immediate: true },
  );

  function refreshCatalogInBackground() {
    void listCategories({ force: false, quiet: true })
      .then((response) => {
        if (response.data?.length) {
          setCategories(response.data);
        }
      })
      .catch(() => undefined);
  }

  function refreshPromotionsInBackground() {
    void listPromotions({ quiet: true })
      .then((response) => {
        promotions.value = (response.data ?? []).filter((promo) => promo.products.length > 0);
      })
      .catch(() => undefined);
  }

  async function loadRecentOrders(branchId: string) {
    if (!branchId) {
      recentOrderProducts.value = [];
      return;
    }

    try {
      const response = await listRecentOrders(branchId, { quiet: true });
      recentOrderProducts.value = response.data ?? [];
    } catch {
      recentOrderProducts.value = [];
    }
  }

  function onPromotionExpandChange(promotionId: string, expanded: boolean) {
    expandedPromotionId.value = expanded ? promotionId : null;
  }

  function syncCartAfterMarketEntry() {
    syncMarketCartEntry();
  }

  function mountMarketHome() {
    hydrateFromStorage();
    if (hasSession.value) {
      void fetchBranchesInBackground();
    }
    syncCartAfterMarketEntry();
    refreshPromotionsInBackground();

    if (visibleCategories.value.length > 0) {
      refreshCatalogInBackground();
    } else {
      isFetchingFirstCatalog.value = true;
      void listCategories({ force: true, quiet: false })
        .then((response) => {
          if (response.data?.length) {
            setCategories(response.data);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          isFetchingFirstCatalog.value = false;
          if (!activeCategoryId.value && visibleCategories.value[0]?.id) {
            activeCategoryId.value = visibleCategories.value[0].id;
          }
        });
    }

    if (!activeCategoryId.value && visibleCategories.value[0]?.id) {
      activeCategoryId.value = visibleCategories.value[0].id;
    }

    nextTick(() => {
      attachScrollListener();
    });
  }

  function activateMarketHome() {
    hydrateFromStorage();
    syncCartAfterMarketEntry();
    refreshPromotionsInBackground();
    if (hasSession.value && activeBranchId.value) {
      void loadRecentOrders(activeBranchId.value);
    }
    if (visibleCategories.value.length > 0) {
      refreshCatalogInBackground();
    }
    nextTick(() => {
      attachScrollListener();
    });
  }

  return {
    visibleCategories,
    promotions,
    recentOrderProducts,
    recentOrdersExpanded,
    expandedPromotionId,
    visiblePromotions,
    showPromotionsBlock,
    showRecentOrdersBlock,
    showCategoryCatalog,
    hasPersistedCatalog,
    isFetchingFirstCatalog,
    marketCatalogPending,
    activeCategoryId,
    categoryRailRef,
    modalProduct,
    onModalOpenChange,
    selectCategory,
    onPromotionExpandChange,
    mountMarketHome,
    activateMarketHome,
    detachScrollListener,
  };
}
