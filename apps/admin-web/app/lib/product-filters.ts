import type { ProductListFilters } from '~/types/inventory';

export const DEFAULT_PRODUCT_LIST_FILTERS: ProductListFilters = {
  name: '',
  category: [],
  productStatus: [],
  inStock: [],
  page: 1,
  limit: 10,
};

function readQueryString(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

function readQueryStringArray(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
) {
  const entry = query[key];
  if (!entry) {
    return [];
  }

  return (Array.isArray(entry) ? entry : [entry]).filter(Boolean) as string[];
}

function readQueryNumber(
  query: Record<string, string | string[] | undefined | null>,
  key: string,
  fallback: number,
) {
  const raw = readQueryString(query, key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseProductListFiltersFromQuery(
  query: Record<string, string | string[] | undefined | null>,
): ProductListFilters {
  return {
    name: readQueryString(query, 'name') ?? '',
    category: readQueryStringArray(query, 'category'),
    productStatus: readQueryStringArray(query, 'productStatus'),
    inStock: readQueryStringArray(query, 'inStock'),
    page: readQueryNumber(query, 'page', DEFAULT_PRODUCT_LIST_FILTERS.page),
    limit: readQueryNumber(query, 'limit', DEFAULT_PRODUCT_LIST_FILTERS.limit),
  };
}

export function productListFiltersToRouteQuery(
  filters: ProductListFilters,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {
    page: String(filters.page),
    limit: String(filters.limit),
  };

  if (filters.name.trim()) {
    query.name = filters.name.trim();
  }

  if (filters.category.length > 0) {
    query.category = filters.category;
  }

  if (filters.productStatus.length > 0) {
    query.productStatus = filters.productStatus;
  }

  if (filters.inStock.length > 0) {
    query.inStock = filters.inStock;
  }

  return query;
}

export function productListFiltersToApiQuery(filters: ProductListFilters) {
  return {
    page: filters.page,
    limit: filters.limit,
    name: filters.name.trim() || undefined,
    category: filters.category.length > 0 ? filters.category : undefined,
    productStatus: filters.productStatus.length > 0 ? filters.productStatus : undefined,
    inStock: filters.inStock.length === 1 ? filters.inStock[0] : undefined,
  };
}

export function hasActiveProductFilters(filters: ProductListFilters) {
  return (
    filters.category.length > 0 ||
    filters.productStatus.length > 0 ||
    filters.inStock.length > 0
  );
}
