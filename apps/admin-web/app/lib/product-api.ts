import { parseInventoryTableMeta, unwrapInventoryData } from '~/lib/inventory-api';
import { mapLegacyProductToListItem } from '~/lib/product-details';
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
