import {
  MARKETPLACE_BANNER_MANIFEST_PATH,
  parseMarketplaceBannerManifest,
  readMarketplaceBannersFromStorage,
  type MarketplaceBannerImage,
} from '~/lib/marketplace-banner-images';

/**
 * Marketplace hero banners — manifest JSON for now; admin uploads will replace via API later.
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
      const fromStorage = readMarketplaceBannersFromStorage();
      if (fromStorage.length > 0) {
        banners.value = fromStorage;
        return;
      }

      const response = await fetch(MARKETPLACE_BANNER_MANIFEST_PATH, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        banners.value = [];
        return;
      }

      const payload = await response.json();
      banners.value = parseMarketplaceBannerManifest(payload);
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
