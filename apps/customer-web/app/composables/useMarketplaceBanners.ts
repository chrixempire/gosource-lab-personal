import {
  parseMarketplaceBannersApiResponse,
  type MarketplaceBannerImage,
} from '~/lib/marketplace-banner-images';

/**
 * Marketplace hero banners from the public API.
 */
export function useMarketplaceBanners() {
  const banners = useState<MarketplaceBannerImage[]>('marketplace-banners', () => []);
  const pending = ref(false);
  const loaded = ref(false);

  async function loadBanners() {
    if (!import.meta.client) {
      return;
    }

    pending.value = true;

    try {
      const response = await $fetch<unknown>('/api/proxy/marketplace-banners', {
        credentials: 'same-origin',
      });
      banners.value = parseMarketplaceBannersApiResponse(response);
    } catch {
      banners.value = [];
    } finally {
      pending.value = false;
      loaded.value = true;
    }
  }

  if (import.meta.client && !loaded.value) {
    void loadBanners();
  }

  return {
    banners,
    pending,
    loaded,
    refresh: loadBanners,
  };
}
