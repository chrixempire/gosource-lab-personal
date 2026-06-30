import type { MarketProduct } from '~/lib/marketplace-data';
import { FALLBACK_PRODUCTS } from '~/lib/design-lab';
import { useCustomerMarketService } from '~/services/market.service';

/**
 * Loads ~12 real GoSource products for the food design lab, preferring ones
 * with images. Falls back to a built-in food set if the catalog can't be
 * reached (e.g. no session), so the showcase always renders something real.
 */
export function useDesignLabProducts(count = 12) {
  const { listCategories } = useCustomerMarketService();

  const products = ref<MarketProduct[]>(FALLBACK_PRODUCTS.slice(0, count));
  const loading = ref(true);
  const usingFallback = ref(true);

  async function load() {
    try {
      const res = await listCategories({ quiet: true });
      const cats = res?.data ?? [];
      const all = cats.flatMap((c) => c.products ?? []);
      const withImage = all.filter((p) => p.imageUrl);
      const pool = withImage.length >= count ? withImage : all;
      const chosen = pool.slice(0, count);

      if (chosen.length >= 4) {
        products.value = chosen;
        usingFallback.value = false;
      }
    } catch {
      /* keep fallback */
    } finally {
      loading.value = false;
    }
  }

  if (import.meta.client) {
    onMounted(load);
  } else {
    loading.value = false;
  }

  return { products, loading, usingFallback };
}
