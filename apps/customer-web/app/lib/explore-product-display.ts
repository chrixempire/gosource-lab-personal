import type { MarketProduct } from '~/lib/marketplace-data';
import { defaultUnitForProduct, getMarketUnitChoice } from '~/lib/marketplace-data';

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
