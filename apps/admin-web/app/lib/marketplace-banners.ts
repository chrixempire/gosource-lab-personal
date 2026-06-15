import { unwrapLegacyPayload } from '~/lib/dashboard-api';

export type MarketplaceBannerDraftSlot = {
  id: string;
  src: string;
  file: File | null;
  alt: string;
  storageKey?: string | null;
  linkUrl?: string | null;
};

export type MarketplaceBannerRecord = {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string | null;
  storageKey?: string | null;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function parseMarketplaceBannerRecords(payload: unknown): MarketplaceBannerRecord[] {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const banners = body?.banners;

  if (!Array.isArray(banners)) {
    return [];
  }

  return banners
    .map((entry, index) => {
      const record = asRecord(entry);
      if (!record) {
        return null;
      }

      const imageUrl = String(record.imageUrl ?? '').trim();
      if (!imageUrl) {
        return null;
      }

      return {
        id: String(record.id ?? `banner-${index + 1}`),
        imageUrl,
        alt: String(record.alt ?? 'Marketplace banner'),
        linkUrl: (record.linkUrl as string | null | undefined) ?? '/market',
        storageKey: String(record.storageKey ?? '').trim() || null,
      };
    })
    .filter((entry): entry is MarketplaceBannerRecord => entry != null)
    .slice(0, MARKETPLACE_BANNER_SLOT_COUNT);
}

export function marketplaceBannerRecordsToDraftSlots(
  banners: MarketplaceBannerRecord[],
): MarketplaceBannerDraftSlot[] {
  return banners.map((banner) => ({
    id: banner.id,
    src: banner.imageUrl,
    file: null,
    alt: banner.alt,
    storageKey: banner.storageKey,
    linkUrl: banner.linkUrl ?? '/market',
  }));
}

export function createEmptyBannerSlots(): MarketplaceBannerDraftSlot[] {
  return [];
}

export function createSampleBannerSlots(): MarketplaceBannerDraftSlot[] {
  return MARKETPLACE_BANNER_SAMPLE_URLS.map((src, index) => ({
    id: `banner-${index + 1}`,
    src,
    file: null,
    alt: `Marketplace banner ${index + 1}`,
    linkUrl: '/market',
  }));
}

export async function loadSampleBannerSlots(): Promise<MarketplaceBannerDraftSlot[]> {
  const slots: MarketplaceBannerDraftSlot[] = [];

  for (const [index, src] of MARKETPLACE_BANNER_SAMPLE_URLS.entries()) {
    const response = await fetch(src);
    if (!response.ok) {
      continue;
    }

    const blob = await response.blob();
    const extension = src.split('.').pop() ?? 'jpg';
    const file = new File([blob], `banner-${index + 1}.${extension}`, {
      type: blob.type || 'image/jpeg',
    });

    slots.push({
      id: `banner-${index + 1}`,
      src: URL.createObjectURL(file),
      file,
      alt: `Marketplace banner ${index + 1}`,
      linkUrl: '/market',
    });
  }

  return slots;
}

export function buildMarketplaceBannerSaveFormData(
  slots: MarketplaceBannerDraftSlot[],
): FormData {
  const formData = new FormData();
  const banners = slots.map((slot) => {
    const entry: Record<string, string> = {
      id: slot.id,
      alt: slot.alt || 'Marketplace banner',
      linkUrl: slot.linkUrl ?? '/market',
    };

    if (!slot.file && slot.storageKey) {
      entry.imageUrl = slot.src;
      entry.storageKey = slot.storageKey;
    }

    return entry;
  });

  formData.append('banners', JSON.stringify(banners));

  for (const slot of slots) {
    if (slot.file) {
      formData.append(`banner_${slot.id}`, slot.file);
    }
  }

  return formData;
}

export async function fetchMarketplaceBanners() {
  const payload = await $fetch<unknown>('/api/marketplace-banners', {
    credentials: 'same-origin',
  });

  return parseMarketplaceBannerRecords(payload);
}

export async function saveMarketplaceBanners(slots: MarketplaceBannerDraftSlot[]) {
  const payload = await $fetch<unknown>('/api/marketplace-banners', {
    method: 'PUT',
    body: buildMarketplaceBannerSaveFormData(slots),
    credentials: 'same-origin',
  });

  return parseMarketplaceBannerRecords(payload);
}
