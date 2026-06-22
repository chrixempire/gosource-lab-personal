import { parseInventoryTableMeta, unwrapInventoryData } from '~/lib/inventory-api';
import type {
  AdminCategoryDetailsView,
  AdminCategoryListItem,
  CategoryOption,
  LegacyCategoryRow,
} from '~/types/inventory';

export function mapLegacyCategoryToListItem(category: LegacyCategoryRow): AdminCategoryListItem {
  const productCount = category.productCount ?? 0;

  return {
    id: category._id,
    name: category.name ?? '—',
    description: category.desc ?? '—',
    productCount,
    productCountLabel: String(productCount),
    position: category.position ?? 0,
    imageUrl: category.image ?? null,
  };
}

export function mapLegacyCategoryToDetailsView(
  category: LegacyCategoryRow,
): AdminCategoryDetailsView {
  const productCount = category.productCount ?? 0;

  return {
    id: category._id,
    name: category.name ?? '—',
    description: category.desc ?? '—',
    productCount,
    position: category.position ?? 0,
    imageUrl: category.image ?? null,
    createdAtLabel: category.createdAt
      ? new Date(category.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null,
  };
}

export function parseCategoryDetail(payload: unknown): AdminCategoryDetailsView | null {
  const body = unwrapInventoryData(payload);
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (record._id) {
    return mapLegacyCategoryToDetailsView(record as LegacyCategoryRow);
  }

  const nested = record.category;
  if (nested && typeof nested === 'object') {
    return mapLegacyCategoryToDetailsView(nested as LegacyCategoryRow);
  }

  return null;
}

export function parseCategoriesResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
) {
  const body = unwrapInventoryData(payload);
  const categories = Array.isArray(body?.categories)
    ? (body.categories as LegacyCategoryRow[])
    : [];

  return {
    rows: categories.map(mapLegacyCategoryToListItem),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
  };
}

export function parseCategoryOptions(payload: unknown): CategoryOption[] {
  const body = unwrapInventoryData(payload);
  const categories = Array.isArray(body?.categories)
    ? (body.categories as LegacyCategoryRow[])
    : Array.isArray(body) ? (body as LegacyCategoryRow[]) : [];

  return categories.flatMap((category): CategoryOption[] => {
      const id = category._id;
      const label = category.name;

      if (!id || !label) {
        return [];
      }

      return [{ id, label, imageUrl: category.image ?? null }];
    });
}
