import type { MarketProduct } from '~/lib/marketplace-data';
import { defaultUnitForProduct, getMarketUnitChoice } from '~/lib/marketplace-data';

/** Cheapest (smallest) purchasable unit + its price — the entry-point "From" price. */
export function smallestUnitForProduct(
  product: MarketProduct,
): { name: string; priceNaira: number } {
  const choices = product.unitChoices;
  if (choices?.length) {
    let best = choices[0]!;
    let bestPrice = best.discountedPriceNaira ?? best.priceNaira;
    for (const c of choices) {
      const price = c.discountedPriceNaira ?? c.priceNaira;
      if (price < bestPrice) {
        best = c;
        bestPrice = price;
      }
    }
    return { name: best.name, priceNaira: bestPrice };
  }
  const name = defaultUnitForProduct(product);
  const choice = getMarketUnitChoice(product, name);
  return { name, priceNaira: choice?.priceNaira ?? product.priceNaira };
}

/** Sprout-card unit line, e.g. "half-carton = ₦43,000.00" (smallest unit). */
export function sproutUnitLine(product: MarketProduct): string {
  const u = smallestUnitForProduct(product);
  return `${u.name} = ₦${u.priceNaira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function exploreProductDiscountLabel(product: MarketProduct): string | null {
  if (product.discountPct && product.discountPct > 0) {
    return `-${product.discountPct}%`;
  }

  const promo = product.promotion;
  if (!promo || promo.discountValue <= 0) {
    return null;
  }

  if (promo.isPercentageDiscounted) {
    return `-${promo.discountValue}%`;
  }

  return `-₦${promo.discountValue.toLocaleString('en-NG')}`;
}

/** Brand / stock copy from API only (no placeholders). */
export function exploreProductMetaLine(product: MarketProduct): string | null {
  const parts: string[] = [];

  const brand = product.brandLabel?.trim();
  if (brand) {
    parts.push(brand);
  }

  const stock = product.stockNote?.trim();
  if (stock) {
    parts.push(stock);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Unit + price line derived from catalog payload (falls back when badge is malformed). */
export function exploreProductUnitLine(product: MarketProduct): string | null {
  const badge = product.unitPriceBadge?.trim();
  if (badge && !/undefined/i.test(badge)) {
    return badge;
  }

  const unit = defaultUnitForProduct(product);
  if (!unit || /^undefined$/i.test(unit)) {
    return null;
  }

  const choice = getMarketUnitChoice(product, unit);
  const price = choice?.priceNaira ?? product.priceNaira;
  if (!Number.isFinite(price) || price <= 0) {
    return unit;
  }

  return `${unit} – ₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
