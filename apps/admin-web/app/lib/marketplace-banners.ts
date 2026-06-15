export type MarketplaceBannerDraftSlot = {
  id: string;
  src: string;
  file: File | null;
  alt: string;
};

export const MARKETPLACE_BANNER_SLOT_COUNT = 4;

export const MARKETPLACE_BANNER_ROTATE_MS = 5500;

export const MARKETPLACE_BANNER_LOCAL_STORAGE_KEY = 'gosource-marketplace-banners-v1';

export const MARKETPLACE_BANNER_SAMPLE_URLS = [
  '/marketplace-banners/banner-1.jpg',
  '/marketplace-banners/banner-2.jpg',
  '/marketplace-banners/banner-3.jpg',
  '/marketplace-banners/banner-4.jpg',
] as const;

export type MarketplaceBannerPublishPayload = {
  banners: Array<{
    id: string;
    imageUrl: string;
    alt: string;
    linkUrl?: string | null;
  }>;
};

export function createEmptyBannerSlots(): MarketplaceBannerDraftSlot[] {
  return [];
}

export function readMarketplaceBannerDraftFromStorage(): MarketplaceBannerDraftSlot[] {
  if (!import.meta.client) {
    return [];
  }

  try {
    const raw = localStorage.getItem(MARKETPLACE_BANNER_LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as MarketplaceBannerPublishPayload;
    if (!Array.isArray(parsed.banners)) {
      return [];
    }

    return parsed.banners.map((banner) => ({
      id: banner.id,
      src: banner.imageUrl,
      file: null,
      alt: banner.alt,
    }));
  } catch {
    return [];
  }
}

export function writeMarketplaceBannerDraftToStorage(payload: MarketplaceBannerPublishPayload) {
  if (!import.meta.client) {
    return;
  }

  localStorage.setItem(MARKETPLACE_BANNER_LOCAL_STORAGE_KEY, JSON.stringify(payload));
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function buildMarketplaceBannerPublishPayload(
  slots: MarketplaceBannerDraftSlot[],
): Promise<MarketplaceBannerPublishPayload> {
  const banners = [];

  for (const slot of slots) {
    let imageUrl = slot.src;

    if (slot.file) {
      imageUrl = await fileToDataUrl(slot.file);
    }

    if (!imageUrl) {
      continue;
    }

    banners.push({
      id: slot.id,
      imageUrl,
      alt: slot.alt || 'Marketplace banner',
      linkUrl: '/market',
    });
  }

  return { banners };
}
