import type { MarketCartItem, MarketProduct } from '~/lib/marketplace-data';
import {
  cartLineKey,
  getMarketProductById,
  getMarketUnitPrice,
  registerMarketProduct,
} from '~/lib/marketplace-data';

export const GUEST_MARKET_CART_STORAGE_KEY = 'gosource.guest-market-cart';

export type GuestCartStoredLine = {
  productId: string;
  unit: string;
  quantity: number;
  /** Snapshot so guest cart survives refresh without full catalog loaded. */
  product?: MarketProduct;
};

export function readGuestCartFromStorage(): GuestCartStoredLine[] {
  if (!import.meta.client) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(GUEST_MARKET_CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => {
        const row = entry as Partial<GuestCartStoredLine>;
        const productId = String(row.productId ?? '').trim();
        const unit = String(row.unit ?? '').trim() || 'Standard pack';
        const quantity = Math.max(0, Math.floor(Number(row.quantity ?? 0)));

        if (!productId || quantity <= 0) {
          return null;
        }

        const snapshot = row.product as MarketProduct | undefined;
        const product =
          snapshot && String(snapshot.id ?? '').trim() === productId ? snapshot : undefined;

        return { productId, unit, quantity, ...(product ? { product } : {}) };
      })
      .filter((line): line is GuestCartStoredLine => line !== null);
  } catch {
    return [];
  }
}

export function writeGuestCartToStorage(lines: GuestCartStoredLine[]) {
  if (!import.meta.client) {
    return;
  }

  try {
    if (!lines.length) {
      window.localStorage.removeItem(GUEST_MARKET_CART_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(GUEST_MARKET_CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // ignore quota errors
  }
}

export function clearGuestCartStorage() {
  if (!import.meta.client) {
    return;
  }

  window.localStorage.removeItem(GUEST_MARKET_CART_STORAGE_KEY);
}

export function guestStoredLinesToCartItems(stored: GuestCartStoredLine[]): MarketCartItem[] {
  return stored.map((line) => {
    if (line.product) {
      registerMarketProduct(line.product);
    }

    const product = line.product ?? getMarketProductById(line.productId);
    const lineTotalNaira = product
      ? getMarketUnitPrice(product, line.unit) * line.quantity
      : 0;

    return {
      id: cartLineKey(line.productId, line.unit),
      productId: line.productId,
      unit: line.unit,
      quantity: line.quantity,
      product,
      lineTotalNaira,
    };
  });
}

export function cartItemsToGuestStoredLines(items: MarketCartItem[]): GuestCartStoredLine[] {
  return items
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      productId: line.productId,
      unit: line.unit,
      quantity: line.quantity,
      ...(line.product ? { product: line.product } : {}),
    }));
}

/** Prefer in-memory cart lines; fall back to localStorage for lines not in memory. */
export function getGuestCartSnapshot(inMemoryItems: MarketCartItem[]): GuestCartStoredLine[] {
  const fromMemory = cartItemsToGuestStoredLines(inMemoryItems);
  if (!fromMemory.length) {
    return readGuestCartFromStorage();
  }

  const memoryKeys = new Set(
    fromMemory.map((line) => cartLineKey(line.productId, line.unit)),
  );
  const fromStorageOnly = readGuestCartFromStorage().filter(
    (line) => !memoryKeys.has(cartLineKey(line.productId, line.unit)),
  );

  return [...fromMemory, ...fromStorageOnly];
}

export function mergeGuestCartLine(
  items: GuestCartStoredLine[],
  productId: string,
  unit: string,
  quantity: number,
): GuestCartStoredLine[] {
  const next = Math.max(0, Math.min(999, Math.floor(quantity)));
  const copy = items.filter((line) => !(line.productId === productId && line.unit === unit));

  if (next > 0) {
    copy.push({ productId, unit, quantity: next });
  }

  return copy;
}

export function buildGuestCartPreview(product: MarketProduct, unit: string, quantity: number): MarketCartItem {
  return {
    id: cartLineKey(product.id, unit),
    productId: product.id,
    unit,
    quantity,
    product,
    lineTotalNaira: getMarketUnitPrice(product, unit) * quantity,
  };
}
