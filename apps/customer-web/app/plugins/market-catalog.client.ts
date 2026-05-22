import type { MarketCategory } from '~/lib/marketplace-data';
import { readCachedCategoriesFromStorage } from '~/services/market.service';

/**
 * Prime in-memory catalog from localStorage before route components render.
 */
export default defineNuxtPlugin({
  name: 'market-catalog',
  enforce: 'pre',
  setup() {
    const cached = readCachedCategoriesFromStorage({ allowStale: true });
    if (!cached?.length) {
      return;
    }

    const categories = useState<MarketCategory[]>('market-categories', () => []);
    if (!categories.value?.length) {
      categories.value = cached;
    }

    const categoriesCache = useState<{ data: MarketCategory[]; fetchedAt: number } | null>(
      'market-categories-response-cache',
      () => null,
    );
    if (!categoriesCache.value) {
      try {
        const raw = window.localStorage.getItem('gosource.market.categories');
        if (raw) {
          categoriesCache.value = JSON.parse(raw) as { data: MarketCategory[]; fetchedAt: number };
        }
      } catch {
      }
    }
  },
});
