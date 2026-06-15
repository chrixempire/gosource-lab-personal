export type MarketplaceBannerImage = {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string | null;
};

export type MarketplaceBannerManifest = {
  banners: MarketplaceBannerImage[];
};

export const MARKETPLACE_BANNER_MANIFEST_PATH = '/marketplace-banners/manifest.json';

export const MARKETPLACE_BANNER_ROTATE_MS = 5500;

export const MARKETPLACE_BANNER_LOCAL_STORAGE_KEY = 'gosource-marketplace-banners-v1';

export function parseMarketplaceBannerManifest(payload: unknown): MarketplaceBannerImage[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const banners = (payload as MarketplaceBannerManifest).banners;
  if (!Array.isArray(banners)) {
    return [];
  }

  return banners
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const imageUrl = String((entry as MarketplaceBannerImage).imageUrl ?? '').trim();
      if (!imageUrl) {
        return null;
      }

      return {
        id: String((entry as MarketplaceBannerImage).id ?? `banner-${index + 1}`),
        imageUrl,
        alt: String((entry as MarketplaceBannerImage).alt ?? 'Marketplace promotion'),
        linkUrl: (entry as MarketplaceBannerImage).linkUrl ?? null,
      };
    })
    .filter((entry): entry is MarketplaceBannerImage => entry != null)
    .slice(0, 4);
}

export function readMarketplaceBannersFromStorage(): MarketplaceBannerImage[] {
  if (!import.meta.client) {
    return [];
  }

  try {
    const raw = localStorage.getItem(MARKETPLACE_BANNER_LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return parseMarketplaceBannerManifest(JSON.parse(raw));
  } catch {
    return [];
  }
}
