import type { MarketCategory, MarketProduct } from '~/lib/marketplace-data';
import { readCachedCategoriesFromStorage, writeCachedCategoriesToStorage } from '~/services/market.service';

function readPersistedCatalog(): MarketCategory[] {
  if (!import.meta.client) {
    return [];
  }
  return readCachedCategoriesFromStorage({ allowStale: true }) ?? [];
}

function asCategoryList(value: MarketCategory[] | null | undefined): MarketCategory[] {
  return Array.isArray(value) ? value : [];
}

export function useMarketCatalog() {
  const categories = useState<MarketCategory[]>('market-categories', () => []);

  function catalogList(): MarketCategory[] {
    return asCategoryList(categories.value);
  }

  function persist(next: MarketCategory[]) {
    if (import.meta.client && next.length > 0) {
      writeCachedCategoriesToStorage(next);
    }
  }

  function hydrateFromStorage(): MarketCategory[] {
    if (!import.meta.client) {
      return catalogList();
    }

    const current = catalogList();
    if (current.length > 0) {
      return current;
    }

    const cached = readPersistedCatalog();
    if (cached.length > 0) {
      categories.value = cached;
    }

    return catalogList();
  }

  function setCategories(next: MarketCategory[] | null | undefined) {
    const list = asCategoryList(next);
    if (!list.length) {
      return;
    }
    categories.value = list;
    persist(list);
  }

  function upsertCategory(next: MarketCategory) {
    const nextCategories = [...catalogList()];
    const existingIndex = nextCategories.findIndex((item) => item.id === next.id);

    if (existingIndex === -1) {
      nextCategories.push(next);
    } else {
      nextCategories[existingIndex] = next;
    }

    categories.value = nextCategories;
    persist(nextCategories);
  }

  function findProductById(id: string): MarketProduct | undefined {
    const source = catalogList().length > 0 ? catalogList() : readPersistedCatalog();
    return source
      .flatMap((category) => category.products ?? [])
      .find((product) => product.id === id);
  }

  function findCategoryById(id: string): MarketCategory | undefined {
    const source = catalogList().length > 0 ? catalogList() : readPersistedCatalog();
    return source.find((category) => category.id === id);
  }

  function findProductCategory(productId: string): MarketCategory | undefined {
    const source = catalogList().length > 0 ? catalogList() : readPersistedCatalog();
    return source.find((category) => (category.products ?? []).some((product) => product.id === productId));
  }

  return {
    categories,
    catalogList,
    hydrateFromStorage,
    setCategories,
    upsertCategory,
    findProductById,
    findCategoryById,
    findProductCategory,
    readPersistedCatalog,
  };
}
