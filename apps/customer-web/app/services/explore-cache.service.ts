import type { OrderRecord } from '@gosource/api-client';
import type { ExploreProcurementInsightData } from '~/lib/explore-procurement-insight';
import { MARKET_CACHE_TTL_MS, isMarketCacheFresh } from '~/services/market.service';

export const EXPLORE_CACHE_TTL_MS = MARKET_CACHE_TTL_MS;

export { isMarketCacheFresh as isExploreCacheFresh };

type CachedEnvelope<T> = {
  data: T;
  fetchedAt: number;
};

const STORAGE_PREFIX = 'gosource.explore';

function storageKey(...parts: string[]) {
  return `${STORAGE_PREFIX}.${parts.join('.')}`;
}

function readStorage<T>(key: string): CachedEnvelope<T> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CachedEnvelope<T>) : null;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ data, fetchedAt: Date.now() } satisfies CachedEnvelope<T>),
    );
  } catch {
  }
}

export function exploreLastOrderCacheKey(branchId: string) {
  return storageKey('lastOrder', branchId);
}

export function exploreProcurementCacheKey(branchId: string, monthKey: string) {
  return storageKey('procurement', branchId, monthKey);
}

export function readCachedExploreLastOrder(
  branchId: string,
  options: { allowStale?: boolean } = {},
): OrderRecord | null {
  const parsed = readStorage<OrderRecord>(exploreLastOrderCacheKey(branchId));
  if (!parsed?.data) {
    return null;
  }

  if (!options.allowStale && !isMarketCacheFresh(parsed.fetchedAt)) {
    return null;
  }

  return parsed.data;
}

export function writeCachedExploreLastOrder(branchId: string, order: OrderRecord | null) {
  if (!order) {
    return;
  }

  writeStorage(exploreLastOrderCacheKey(branchId), order);
}

export function readCachedExploreProcurement(
  branchId: string,
  monthKey: string,
  options: { allowStale?: boolean } = {},
): ExploreProcurementInsightData | null {
  const parsed = readStorage<ExploreProcurementInsightData>(
    exploreProcurementCacheKey(branchId, monthKey),
  );

  if (!parsed?.data || parsed.data.rows.length === 0) {
    return null;
  }

  if (!options.allowStale && !isMarketCacheFresh(parsed.fetchedAt)) {
    return null;
  }

  return parsed.data;
}

export function writeCachedExploreProcurement(
  branchId: string,
  monthKey: string,
  insight: ExploreProcurementInsightData,
) {
  writeStorage(exploreProcurementCacheKey(branchId, monthKey), insight);
}

export function currentExploreMonthCacheKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
