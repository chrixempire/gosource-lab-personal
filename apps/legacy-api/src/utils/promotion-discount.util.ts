export type ProductPromotionSnapshot = {
  isPercentageDiscounted?: boolean;
  discountValue?: number;
};

export type PromotionDiscountProduct = {
  version?: string;
  unit?: unknown;
  discountedUnit?: unknown;
  actualPrice?: number;
  discountPrice?: number;
  promotion?: ProductPromotionSnapshot | null;
};

const PRICE_EPSILON = 0.001;

export function parseUnitPriceMap(raw: unknown): Record<string, number> | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return entriesToUnitMap(Object.entries(raw as Record<string, unknown>));
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return entriesToUnitMap(Object.entries(parsed as Record<string, unknown>));
    }
  } catch {
    return null;
  }

  return null;
}

function entriesToUnitMap(entries: [string, unknown][]): Record<string, number> | null {
  const unitMap: Record<string, number> = {};

  for (const [unit, price] of entries) {
    const numericPrice = Number(price);
    if (!Number.isNaN(numericPrice)) {
      unitMap[unit] = numericPrice;
    }
  }

  return Object.keys(unitMap).length > 0 ? unitMap : null;
}

export function computePercentageDiscountPrice(
  price: number,
  discountValue: number,
): number {
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) {
    return 0;
  }

  const discountPrice =
    numericPrice - (numericPrice * discountValue) / 100;

  return Math.max(0, discountPrice);
}

export function computeDiscountedUnitMap(
  unitRaw: unknown,
  discountValue: number,
): Record<string, number> | null {
  const unitMap = parseUnitPriceMap(unitRaw);
  if (!unitMap) {
    return null;
  }

  const discountedUnits: Record<string, number> = {};

  for (const [unit, price] of Object.entries(unitMap)) {
    discountedUnits[unit] = computePercentageDiscountPrice(price, discountValue);
  }

  return discountedUnits;
}

export function areUnitPriceMapsEqual(
  expected: Record<string, number>,
  stored: Record<string, number> | null,
): boolean {
  if (!stored) {
    return false;
  }

  for (const [key, expectedPrice] of Object.entries(expected)) {
    const storedPrice = stored[key];
    if (
      storedPrice === undefined ||
      Math.abs(storedPrice - expectedPrice) > PRICE_EPSILON
    ) {
      return false;
    }
  }

  for (const key of Object.keys(stored)) {
    if (!(key in expected)) {
      return false;
    }
  }

  return true;
}

function hasPercentagePromotion(product: PromotionDiscountProduct) {
  const promotion = product.promotion;
  return Boolean(
    promotion?.isPercentageDiscounted &&
      promotion.discountValue &&
      promotion.discountValue > 0,
  );
}

export function buildExpectedPromotionDiscount(
  product: PromotionDiscountProduct,
): Partial<{ discountedUnit: string; discountPrice: number }> | null {
  if (!hasPercentagePromotion(product)) {
    return null;
  }

  const discountValue = product.promotion!.discountValue!;

  if (product.version === 'v2') {
    const discountedUnits = computeDiscountedUnitMap(product.unit, discountValue);
    if (!discountedUnits) {
      return null;
    }

    return { discountedUnit: JSON.stringify(discountedUnits) };
  }

  return {
    discountPrice: computePercentageDiscountPrice(
      product.actualPrice ?? 0,
      discountValue,
    ),
  };
}

export function isPromotionDiscountStale(
  product: PromotionDiscountProduct,
): boolean {
  const expected = buildExpectedPromotionDiscount(product);
  if (!expected) {
    return false;
  }

  if (product.version === 'v2') {
    const expectedMap = parseUnitPriceMap(expected.discountedUnit);
    const storedMap = parseUnitPriceMap(product.discountedUnit);
    if (!expectedMap) {
      return false;
    }

    return !areUnitPriceMapsEqual(expectedMap, storedMap);
  }

  const expectedPrice = expected.discountPrice ?? 0;
  const storedPrice = product.discountPrice ?? product.actualPrice ?? 0;

  return Math.abs(expectedPrice - storedPrice) > PRICE_EPSILON;
}

export function buildPromotionDiscountPatch(
  product: PromotionDiscountProduct,
): Partial<{ discountedUnit: string; discountPrice: number }> | null {
  if (!isPromotionDiscountStale(product)) {
    return null;
  }

  return buildExpectedPromotionDiscount(product);
}
