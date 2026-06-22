import { formatDashboardCurrency } from '~/lib/dashboard-date';
import type {
  AdminProductListItem,
  LegacyProductRow,
  ProductUnitOption,
} from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeUnitKey(value: string) {
  return value.trim().toLowerCase();
}

function isLikelyUnitPriceMap(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.includes('":');
}

export type UnitPriceEntry = {
  key: string;
  normalizedKey: string;
  price: number;
};

export function parseUnitPriceMap(value: unknown): UnitPriceEntry[] | null {
  let parsed: Record<string, unknown> | null = null;

  if (asRecord(value)) {
    parsed = value as Record<string, unknown>;
  } else if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) {
      return null;
    }

    try {
      const next = JSON.parse(raw) as unknown;
      const nextRecord = asRecord(next);
      if (nextRecord) {
        parsed = nextRecord;
      }
    } catch {
      const fallbackEntries = Array.from(
        raw.matchAll(/"?([A-Za-z][A-Za-z\s-]*)"?\s*:\s*"?(\d+(?:\.\d+)?)"?/g),
      )
        .map(([, key = '', amount = '']) => ({
          key: key.trim(),
          normalizedKey: normalizeUnitKey(key),
          price: Number(amount),
        }))
        .filter((entry) => Number.isFinite(entry.price) && entry.price > 0);

      return fallbackEntries.length > 0 ? fallbackEntries : null;
    }
  }

  if (!parsed) {
    return null;
  }

  const entries = Object.entries(parsed)
    .map(([key, entryValue]) => ({
      key: key.trim(),
      normalizedKey: normalizeUnitKey(key),
      price: toNumber(entryValue),
    }))
    .filter((entry) => entry.price > 0);

  return entries.length > 0 ? entries : null;
}

function formatPriceRange(prices: number[]) {
  if (prices.length === 0) {
    return formatDashboardCurrency(0);
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return formatDashboardCurrency(min);
  }

  return `${formatDashboardCurrency(min)} - ${formatDashboardCurrency(max)}`;
}

export function formatProductListPrices(product: LegacyProductRow) {
  const unitMap = parseUnitPriceMap(product.unit);
  const discountedMap = parseUnitPriceMap(product.discountedUnit);

  if (unitMap?.length) {
    const originalPrices = unitMap.map((entry) => entry.price);
    const effectivePrices = unitMap.map((entry) => {
      const discounted = discountedMap?.find(
        (candidate) => candidate.normalizedKey === entry.normalizedKey,
      )?.price;
      return discounted && discounted > 0 ? discounted : entry.price;
    });

    const showCompare = effectivePrices.some(
      (price, index) => price < (originalPrices[index] ?? price),
    );

    return {
      priceLabel: formatPriceRange(effectivePrices),
      compareAtPriceLabel: showCompare ? formatPriceRange(originalPrices) : null,
    };
  }

  const selling = toNumber(product.discountPrice ?? product.totalPrice);
  const compareAt = toNumber(product.marketPrice);
  const showCompare = compareAt > 0 && Math.round(compareAt) !== Math.round(selling);

  return {
    priceLabel: formatDashboardCurrency(selling || compareAt),
    compareAtPriceLabel: showCompare ? formatDashboardCurrency(compareAt) : null,
  };
}

export function countProductUnitOptions(product: LegacyProductRow) {
  return parseUnitPriceMap(product.unit)?.length ?? 0;
}

function parseProductUnitValue(unit: LegacyProductRow['unit']) {
  if (!unit) {
    return null;
  }

  if (typeof unit === 'string') {
    try {
      return JSON.parse(unit) as unknown;
    } catch {
      return unit;
    }
  }

  return unit;
}

export function formatProductUnit(unit: LegacyProductRow['unit']) {
  const parsed = parseProductUnitValue(unit);

  if (!parsed) {
    return '—';
  }

  if (Array.isArray(parsed)) {
    const first = parsed[0];
    if (first && typeof first === 'object' && 'name' in first) {
      return String((first as { name?: string }).name ?? '—');
    }
    return `${parsed.length} units`;
  }

  if (typeof parsed === 'object' && parsed && 'name' in parsed) {
    return String((parsed as { name?: string }).name ?? '—');
  }

  if (typeof parsed === 'string') {
    return parsed;
  }

  return '—';
}

/** Raw unit string used to prefill add/remove stock modals (v2 `quantity.unit`). */
export function getProductStockUnitRaw(product: LegacyProductRow) {
  if (product.purchaseUnit?.trim()) {
    return product.purchaseUnit.trim();
  }

  const unitMap = parseUnitPriceMap(product.unit);
  if (unitMap?.length === 1) {
    return unitMap[0]?.key ?? '';
  }

  const rawUnit = typeof product.unit === 'string' ? product.unit.trim() : '';
  if (rawUnit && !isLikelyUnitPriceMap(rawUnit)) {
    return rawUnit;
  }

  const newUnit = (product as LegacyProductRow & { newUnit?: unknown }).newUnit;
  if (Array.isArray(newUnit) && newUnit.length > 0) {
    const first = newUnit[0];
    if (first && typeof first === 'object' && 'unit' in first) {
      const unit = (first as { unit?: string }).unit;
      if (typeof unit === 'string' && unit.trim()) {
        return unit.trim();
      }
    }
  }

  return '';
}

export function formatPurchaseUnitLabel(product: LegacyProductRow) {
  const raw = getProductStockUnitRaw(product);
  if (raw) {
    return raw;
  }

  return formatProductUnit(product.unit);
}

export function formatProductUnitCountLabel(product: LegacyProductRow) {
  const count = countProductUnitOptions(product);

  if (count > 0) {
    return `${count} Unit${count === 1 ? '' : 's'}`;
  }

  return '1 Unit';
}

export function isProductLowStock(product: LegacyProductRow) {
  if (product.trackQuantity === false) {
    return false;
  }

  if (product.lowStockLevel == null) {
    return false;
  }

  const quantity = Number(product.quantity ?? 0);
  const level = Number(product.lowStockLevel);

  if (!Number.isFinite(quantity) || !Number.isFinite(level)) {
    return false;
  }

  return quantity <= level;
}

export function getProductStockAlert(product: LegacyProductRow) {
  if (product.inStock === false) {
    return { label: 'Out Of Stock!', variant: 'negative' as const };
  }

  if (isProductLowStock(product)) {
    return { label: 'Low stock', variant: 'warning' as const };
  }

  return null;
}

function isCategoryObjectIdString(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export function getCategoryLabel(category: LegacyProductRow['category']) {
  if (!category) {
    return '—';
  }

  if (typeof category === 'string') {
    return isCategoryObjectIdString(category) ? '—' : category;
  }

  return category.name ?? '—';
}

export function resolveCategoryId(category: LegacyProductRow['category']): string | null {
  if (!category) {
    return null;
  }

  if (typeof category === 'object') {
    const id = category._id;
    return typeof id === 'string' ? id : id != null ? String(id) : null;
  }

  return isCategoryObjectIdString(category) ? category : null;
}

export function getProductImageUrl(product: LegacyProductRow) {
  const first = product.images?.[0];
  return typeof first?.url === 'string' ? first.url : null;
}

function resolvePromotionId(promotion: LegacyProductRow['promotion']): string | null {
  if (!promotion || typeof promotion !== 'object') {
    return null;
  }

  const id = (promotion as { _id?: string })._id;
  return typeof id === 'string' && id ? id : null;
}

export function mapLegacyProductToListItem(product: LegacyProductRow): AdminProductListItem {
  const active = product.active !== false;
  const { priceLabel, compareAtPriceLabel } = formatProductListPrices(product);

  return {
    id: product._id,
    name: product.name ?? '—',
    description: product.description?.trim() || '—',
    categoryLabel: getCategoryLabel(product.category),
    priceLabel,
    compareAtPriceLabel,
    quantityLabel:
      product.trackQuantity === false ? 'N/A' : formatDashboardNumber(product.quantity ?? 0),
    purchaseUnitLabel: formatPurchaseUnitLabel(product),
    purchaseUnit: getProductStockUnitRaw(product),
    stockAlert: getProductStockAlert(product),
    unitCountLabel: formatProductUnitCountLabel(product),
    inStock: product.inStock !== false,
    active,
    statusLabel: active ? 'Active' : 'Inactive',
    statusVariant: active ? 'success' : 'negative',
    imageUrl: getProductImageUrl(product),
    marketPrice: toNumber(product.marketPrice ?? product.totalPrice),
    hasPromotion: Boolean(product.promotion),
    promotionId: resolvePromotionId(product.promotion),
  };
}

function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat('en-GB').format(value);
}

export function mapLegacyUnits(payload: unknown): ProductUnitOption[] {
  const body = asRecord(payload);
  const data = body?.data;
  const rows = Array.isArray(data) ? data : Array.isArray(payload) ? payload : [];

  return rows
    .map((row) => {
      const record = asRecord(row);
      if (!record) {
        return null;
      }

      const id = typeof record._id === 'string' ? record._id : '';
      const label = typeof record.name === 'string' ? record.name : '';
      const slug =
        typeof record.slug === 'string' && record.slug.trim()
          ? record.slug.trim().toLowerCase()
          : label.trim().toLowerCase().replace(/\s+/g, '-');

      if (!id || !label) {
        return null;
      }

      return { id, label, slug };
    })
    .filter((row): row is ProductUnitOption => row !== null);
}

export type AdminProductDetailsView = {
  id: string;
  name: string;
  description: string;
  categoryLabel: string;
  categoryId: string | null;
  brand: string;
  priceLabel: string;
  marketPriceLabel: string;
  quantityLabel: string;
  unitLabel: string;
  inStock: boolean;
  active: boolean;
  trackQuantity: boolean;
  statusLabel: string;
  statusVariant: 'success' | 'negative';
  imageUrl: string | null;
  createdLabel: string;
  updatedLabel: string;
};

export function formatProductDateTime(value: string | undefined) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function mapLegacyProductToDetailsView(product: LegacyProductRow): AdminProductDetailsView {
  const price = product.discountPrice ?? product.totalPrice ?? 0;
  const active = product.active !== false;
  return {
    id: product._id,
    name: product.name ?? '—',
    description: product.description ?? '—',
    categoryLabel: getCategoryLabel(product.category),
    categoryId: resolveCategoryId(product.category),
    brand: product.brand ?? '—',
    priceLabel: formatDashboardCurrency(price),
    marketPriceLabel: formatDashboardCurrency(product.marketPrice ?? 0),
    quantityLabel:
      product.trackQuantity === false
        ? 'Not tracked'
        : formatDashboardNumber(product.quantity ?? 0),
    unitLabel: formatProductUnit(product.unit),
    inStock: product.inStock !== false,
    active,
    trackQuantity: product.trackQuantity !== false,
    statusLabel: active ? 'Active' : 'Inactive',
    statusVariant: active ? 'success' : 'negative',
    imageUrl: getProductImageUrl(product),
    createdLabel: formatProductDateTime(product.createdAt),
    updatedLabel: formatProductDateTime(product.updatedAt),
  };
}
