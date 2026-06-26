import { parseInventoryTableMeta, unwrapInventoryData } from '~/lib/inventory-api';
import { mapLegacyProductToListItem, parseUnitPriceMap } from '~/lib/product-details';
import type { AdminProductListItem, LegacyProductRow } from '~/types/inventory';

export function parseFilteredProductsResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
) {
  const body = unwrapInventoryData(payload);
  const products = Array.isArray(body?.products)
    ? (body.products as LegacyProductRow[])
    : [];

  return {
    rows: products.map(mapLegacyProductToListItem),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
  };
}

/** A sellable unit option for a product (unit name + its price). */
export type OrderProductUnitOption = { key: string; price: number };

/** Shape needed by the order item picker: units with prices, stock, tracking. */
export type OrderProductPickerItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  version: string;
  units: OrderProductUnitOption[];
  stock: number;
  trackQuantity: boolean;
};

/**
 * Parse the filtered-products response into pickable items with their sellable
 * units + prices, so an admin can choose a unit when adding items to an order.
 */
export function parseOrderProductPickerResponse(
  payload: unknown,
): OrderProductPickerItem[] {
  const body = unwrapInventoryData(payload);
  const products = Array.isArray(body?.products) ? body.products : [];

  return products
    .map((entry) => {
      const raw = (entry ?? {}) as Record<string, any>;
      const id = String(raw._id ?? raw.id ?? '');
      if (!id) return null;

      const unitMap =
        parseUnitPriceMap(raw.discountedUnit) ?? parseUnitPriceMap(raw.unit) ?? [];

      let units: OrderProductUnitOption[] = unitMap.map((unit) => ({
        key: unit.key,
        price: unit.price,
      }));

      // v1 / no unit map: fall back to a single unit at the product price.
      if (units.length === 0) {
        const fallbackUnit =
          (typeof raw.purchaseUnit === 'string' && raw.purchaseUnit) || 'unit';
        units = [{ key: fallbackUnit, price: Number(raw.discountPrice ?? 0) }];
      }

      return {
        id,
        name: String(raw.name ?? 'Product'),
        imageUrl:
          Array.isArray(raw.images) && raw.images[0]?.url
            ? String(raw.images[0].url)
            : null,
        version: String(raw.version ?? ''),
        units,
        stock: Number(raw.quantity ?? 0),
        trackQuantity: Boolean(raw.trackQuantity),
      } satisfies OrderProductPickerItem;
    })
    .filter((item): item is OrderProductPickerItem => Boolean(item));
}
