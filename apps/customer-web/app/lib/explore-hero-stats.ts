import type { OrderRecord } from '@gosource/api-client';
import type { MarketProduct } from '~/lib/marketplace-data';
import { currentMonthQueryRange } from '~/lib/explore-procurement-insight';

export { currentMonthQueryRange };

export function flattenCatalogProducts(
  categories: Array<{ products?: MarketProduct[] }>,
): MarketProduct[] {
  const products: MarketProduct[] = [];

  for (const category of categories) {
    for (const product of category.products ?? []) {
      products.push(product);
    }
  }

  return products;
}

export function buildWalkInPriceByProductId(products: MarketProduct[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const product of products) {
    const walkIn = product.compareAtNaira;
    if (!walkIn || walkIn <= product.priceNaira) {
      continue;
    }

    map.set(product.id, walkIn);
  }

  return map;
}

export function computeWalkInSavingsFromOrders(
  orders: OrderRecord[],
  walkInPriceByProductId: Map<string, number>,
): number {
  let savings = 0;

  for (const order of orders) {
    for (const line of order.products) {
      const productId = line.productId?.trim();
      if (!productId) {
        continue;
      }

      const walkInUnit = walkInPriceByProductId.get(productId);
      if (!walkInUnit || walkInUnit <= line.unitPrice) {
        continue;
      }

      savings += (walkInUnit - line.unitPrice) * line.quantity;
    }
  }

  return Math.max(0, savings);
}
