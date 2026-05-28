import type {
  MarketCartMutationResponse,
  MarketCartResponse,
  MarketCategoriesResponse,
  MarketCategory,
  MarketCategoryResponse,
  MarketProduct,
  MarketProductResponse,
  MarketPromotionsResponse,
  MarketRecentOrdersResponse,
} from '~/lib/marketplace-data';
import { toast } from '@gosource/ui';
import { extractApiErrorMessage } from '~/utils/api-error';

/** How long catalog blobs stay usable before refetch (reference-style persisted browse). */
export const MARKET_CACHE_TTL_MS = 60 * 60 * 1000;

const MARKET_STORAGE_KEYS = {
  /** Bumped when catalog/image shape changes so stale image URLs are not reused. */
  categories: 'gosource.market.categories.v2',
} as const;

export function isMarketCacheFresh(fetchedAt: number | undefined): boolean {
  return Boolean(fetchedAt && Date.now() - fetchedAt < MARKET_CACHE_TTL_MS);
}

function readMarketStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    let raw = window.localStorage.getItem(key);
    if (!raw) {
      raw = window.sessionStorage.getItem(key);
      if (raw) {
        window.localStorage.setItem(key, raw);
        window.sessionStorage.removeItem(key);
      }
    }

    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeMarketStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    window.sessionStorage.removeItem(key);
  } catch {
  }
}

/** Synchronous read for first paint (localStorage; migrates legacy sessionStorage once). */
export function readCachedCategoriesFromStorage(options: { allowStale?: boolean } = {}): MarketCategory[] | null {
  const parsed = readMarketStorage<{ data: MarketCategory[]; fetchedAt: number }>(MARKET_STORAGE_KEYS.categories);
  if (!parsed?.data || (!options.allowStale && !isMarketCacheFresh(parsed.fetchedAt))) {
    return null;
  }

  return parsed.data;
}

export function writeCachedCategoriesToStorage(categories: MarketCategory[]) {
  const fetchedAt = Date.now();
  writeMarketStorage(MARKET_STORAGE_KEYS.categories, { data: categories, fetchedAt });
}

export function useCustomerMarketService() {
  const categoriesCache = useState<{
    data: MarketCategoriesResponse['data'];
    fetchedAt: number;
  } | null>('market-categories-response-cache', () => null);
  const categoryCache = useState<Record<string, { data: MarketCategory; fetchedAt: number }>>(
    'market-category-response-cache',
    () => ({}),
  );
  const productCache = useState<Record<string, { data: MarketProduct; fetchedAt: number }>>(
    'market-product-response-cache',
    () => ({}),
  );

  function isFresh(fetchedAt?: number) {
    return isMarketCacheFresh(fetchedAt);
  }

  /**
   * Fill missing in-memory entries from persisted cache.
   * Important: do not return early when only e.g. productCache is populated — that previously
   * skipped restoring categories from storage after visiting a PDP first (reference apps keep a single store).
   */
  function hydrateCachesFromStorage() {
    if (!categoriesCache.value) {
      const storedCategories = readMarketStorage<{
        data: MarketCategoriesResponse['data'];
        fetchedAt: number;
      }>(MARKET_STORAGE_KEYS.categories);
      if (storedCategories?.data?.length) {
        categoriesCache.value = storedCategories;
      }
    }

    if (
      categoriesCache.value?.data?.length &&
      Object.keys(categoryCache.value).length === 0 &&
      Object.keys(productCache.value).length === 0
    ) {
      warmCategoryEntries(categoriesCache.value.data);
    }
  }

  function syncCatalogState(nextData: MarketCategory[]) {
    if (!import.meta.client || !nextData.length) {
      return;
    }

    const categories = useState<MarketCategory[]>('market-categories', () => []);
    categories.value = nextData;
  }

  async function fetchCategoriesFromNetwork(quiet: boolean) {
    try {
      const response = await $fetch<MarketCategoriesResponse>('/api/proxy/category', {
        credentials: 'same-origin',
      });
      const nextData = response.data ?? [];
      if (nextData.length > 0) {
        categoriesCache.value = {
          data: nextData,
          fetchedAt: Date.now(),
        };
        writeCachedCategoriesToStorage(nextData);
        warmCategoryEntries(nextData);
        syncCatalogState(nextData);
      }
      return response;
    } catch (error) {
      if (!quiet) {
        toast.error(extractApiErrorMessage(error, 'Unable to fetch categories right now'));
      }
      throw error;
    }
  }

  function warmCategoryEntries(categories: MarketCategory[]) {
    const fetchedAt = Date.now();
    const nextCategories = { ...categoryCache.value };
    const nextProducts = { ...productCache.value };

    for (const category of categories) {
      nextCategories[category.id] = { data: category, fetchedAt };
      for (const product of category.products ?? []) {
        nextProducts[product.id] = { data: product, fetchedAt };
      }
    }

    categoryCache.value = nextCategories;
    productCache.value = nextProducts;
  }

  function warmProductEntries(products: MarketProduct[]) {
    if (!products.length) {
      return;
    }

    const fetchedAt = Date.now();
    const nextProducts = { ...productCache.value };
    for (const product of products) {
      if (product.id) {
        nextProducts[product.id] = { data: product, fetchedAt };
      }
    }
    productCache.value = nextProducts;
  }

  return {
    async listCategories(options: { force?: boolean; quiet?: boolean } = {}) {
      hydrateCachesFromStorage();

      const cached = categoriesCache.value;
      const persisted = readCachedCategoriesFromStorage({ allowStale: true });
      const snapshot = cached?.data?.length ? cached.data : (persisted ?? []);
      if (!Array.isArray(snapshot)) {
        return fetchCategoriesFromNetwork(options.quiet ?? false);
      }

      if (!options.force && snapshot.length > 0) {
        const shouldRevalidate = !cached || !isFresh(cached.fetchedAt);
        if (shouldRevalidate) {
          void fetchCategoriesFromNetwork(true).catch(() => undefined);
        }

        return {
          status: true,
          message: 'Categories retrieved successfully',
          data: snapshot,
        } satisfies MarketCategoriesResponse;
      }

      return fetchCategoriesFromNetwork(options.quiet ?? false);
    },
    async getCategory(categoryId: string, options: { force?: boolean; quiet?: boolean } = {}) {
      hydrateCachesFromStorage();
      const cached = categoryCache.value[categoryId];
      if (!options.force && cached && isFresh(cached.fetchedAt)) {
        return {
          status: true,
          message: 'Category retrieved successfully',
          data: cached.data,
        } satisfies MarketCategoryResponse;
      }

      try {
        const response = await $fetch<MarketCategoryResponse>(`/api/proxy/category/${categoryId}`, {
          credentials: 'same-origin',
        });
        if (response.data) {
          categoryCache.value = {
            ...categoryCache.value,
            [categoryId]: {
              data: response.data,
              fetchedAt: Date.now(),
            },
          };
          warmCategoryEntries([response.data]);
        }
        return response;
      } catch (error) {
        if (!options.quiet) {
          toast.error(extractApiErrorMessage(error, 'Unable to fetch category right now'));
        }
        throw error;
      }
    },
    async listPromotions(options: { quiet?: boolean } = {}) {
      try {
        const response = await $fetch<MarketPromotionsResponse>('/api/proxy/promotion', {
          credentials: 'same-origin',
        });
        const promotions = response.data ?? [];
        for (const promotion of promotions) {
          warmProductEntries(promotion.products ?? []);
        }
        return response;
      } catch (error) {
        if (!options.quiet) {
          toast.error(extractApiErrorMessage(error, 'Unable to fetch promotions right now'));
        }
        throw error;
      }
    },
    async listRecentOrders(branchId: string, options: { quiet?: boolean } = {}) {
      if (!branchId) {
        return {
          status: true,
          message: 'Recent order products retrieved successfully',
          data: [],
        } satisfies MarketRecentOrdersResponse;
      }

      try {
        const response = await $fetch<MarketRecentOrdersResponse>(
          `/api/proxy/product/recent-orders/${branchId}`,
          { credentials: 'same-origin' },
        );
        warmProductEntries(response.data ?? []);
        return response;
      } catch (error) {
        if (!options.quiet) {
          toast.error(extractApiErrorMessage(error, 'Unable to fetch recent orders right now'));
        }
        throw error;
      }
    },
    async getProduct(productId: string, options: { force?: boolean; quiet?: boolean } = {}) {
      hydrateCachesFromStorage();
      const cached = productCache.value[productId];
      if (!options.force && cached && isFresh(cached.fetchedAt)) {
        return {
          status: true,
          message: 'Product retrieved successfully',
          data: cached.data,
        } satisfies MarketProductResponse;
      }

      try {
        const response = await $fetch<MarketProductResponse>(`/api/proxy/product/${productId}`, {
          credentials: 'same-origin',
        });
        if (response.data) {
          productCache.value = {
            ...productCache.value,
            [productId]: {
              data: response.data,
              fetchedAt: Date.now(),
            },
          };
        }
        return response;
      } catch (error) {
        if (!options.quiet) {
          toast.error(extractApiErrorMessage(error, 'Unable to fetch product right now'));
        }
        throw error;
      }
    },
    async getCart(branchId: string) {
      try {
        return await $fetch<MarketCartResponse>(`/api/proxy/cart/${branchId}`, {
          credentials: 'same-origin',
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to fetch cart right now'));
        throw error;
      }
    },
    async addCartItem(
      payload: { productId: string; branchId?: string; unit: string; quantity: number },
      options: { quiet?: boolean } = {},
    ) {
      try {
        return await $fetch<MarketCartMutationResponse>('/api/proxy/cart', {
          method: 'POST',
          body: payload,
          credentials: 'same-origin',
        });
      } catch (error) {
        if (!options.quiet) {
          toast.error(extractApiErrorMessage(error, 'Unable to add item to cart right now'));
        }
        throw error;
      }
    },
    async updateCartItem(cartId: string, payload: { quantity: number; unit?: string }) {
      try {
        return await $fetch<MarketCartMutationResponse>(`/api/proxy/cart/${cartId}`, {
          method: 'PATCH',
          body: payload,
          credentials: 'same-origin',
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to update cart right now'));
        throw error;
      }
    },
    async updateCartItemQuantity(cartId: string, quantity: number) {
      try {
        return await $fetch<MarketCartMutationResponse>(`/api/proxy/cart/update-quantity/${cartId}`, {
          method: 'PATCH',
          body: { quantity },
          credentials: 'same-origin',
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to update cart quantity right now'));
        throw error;
      }
    },
    async removeCartItem(cartId: string) {
      try {
        return await $fetch<MarketCartMutationResponse>(`/api/proxy/cart/delete/${cartId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to remove item from cart right now'));
        throw error;
      }
    },
    async clearCart(branchId: string) {
      try {
        return await $fetch<MarketCartMutationResponse>(`/api/proxy/cart/${branchId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to clear cart right now'));
        throw error;
      }
    },
  };
}
