import type { MarketCategory, MarketProduct } from "~/lib/marketplace-data";
import {
  categoriesWithProducts,
  isMarketProductInStock,
} from "~/lib/marketplace-data";

export const ALL_EXPLORE_CATEGORIES_ID = "__all__";

/** Accent dots for category chips (matches explore redesign). */
export const EXPLORE_CATEGORY_DOT_COLORS = [
  "#DC2626",
  "#1D4ED8",
  "#166534",
  "#92400E",
  "#7C3AED",
  "#0F766E",
  "#DB2777",
  "#CA8A04",
] as const;

export type ExploreCatalogFilters = {
  categoryId: string;
  inStockOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
};

export function exploreCategoryDotColor(index: number): string {
  return (
    EXPLORE_CATEGORY_DOT_COLORS[index % EXPLORE_CATEGORY_DOT_COLORS.length] ??
    "#6B7280"
  );
}

export function productListPriceNaira(product: MarketProduct): number {
  if (Number.isFinite(product.priceNaira) && product.priceNaira > 0) {
    return product.priceNaira;
  }

  const choices = product.unitChoices ?? [];
  const prices = choices
    .map((choice) => choice.discountedPriceNaira ?? choice.priceNaira)
    .filter((value) => Number.isFinite(value) && value > 0);

  return prices.length ? Math.min(...prices) : 0;
}

export function filterExploreProduct(
  product: MarketProduct,
  filters: Pick<ExploreCatalogFilters, "inStockOnly" | "priceMin" | "priceMax">,
): boolean {
  if (filters.inStockOnly && !isMarketProductInStock(product)) {
    return false;
  }

  const price = productListPriceNaira(product);

  if (filters.priceMin != null && price < filters.priceMin) {
    return false;
  }

  if (filters.priceMax != null && price > filters.priceMax) {
    return false;
  }

  return true;
}

export function collectExploreProducts(
  categories: MarketCategory[],
  categoryId: string,
): MarketProduct[] {
  const visible = categoriesWithProducts(categories);

  if (categoryId === ALL_EXPLORE_CATEGORIES_ID) {
    return visible.flatMap((category) => category.products ?? []);
  }

  return visible.find((category) => category.id === categoryId)?.products ?? [];
}

export function filterExploreCatalog(
  categories: MarketCategory[],
  filters: ExploreCatalogFilters,
): MarketProduct[] {
  return collectExploreProducts(categories, filters.categoryId).filter(
    (product) => filterExploreProduct(product, filters),
  );
}

export function hasActiveExplorePriceFilter(
  filters: Pick<ExploreCatalogFilters, "priceMin" | "priceMax">,
) {
  return filters.priceMin != null || filters.priceMax != null;
}

export type ExploreCategorySection = MarketCategory & {
  products: MarketProduct[];
};

export function buildExploreSections(
  categories: MarketCategory[],
  filters: Pick<ExploreCatalogFilters, "inStockOnly" | "priceMin" | "priceMax">,
): ExploreCategorySection[] {
  const productFilters = {
    inStockOnly: filters.inStockOnly,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  };

  return categoriesWithProducts(categories)
    .map((category) => ({
      ...category,
      products: (category.products ?? []).filter((product) =>
        filterExploreProduct(product, productFilters),
      ),
    }))
    .filter((section) => section.products.length > 0);
}

export function exploreCategoryInitial(title: string) {
  const trimmed = title.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export type ExploreRouteFilters = {
  categoryId: string;
  inStockOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
};

type RouteQuery = Record<
  string,
  string | null | undefined | Array<string | null>
>;

function readQueryString(query: RouteQuery, key: string) {
  const entry = query[key];
  return Array.isArray(entry) ? entry[0] : entry;
}

function readQueryNumber(query: RouteQuery, key: string) {
  const raw = readQueryString(query, key)?.trim();
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function parseExploreFiltersFromRoute(
  query: RouteQuery,
): ExploreRouteFilters {
  const categoryRaw = readQueryString(query, "category")?.trim();
  const categoryId =
    categoryRaw && categoryRaw !== "all"
      ? categoryRaw
      : ALL_EXPLORE_CATEGORIES_ID;

  return {
    categoryId,
    inStockOnly: readQueryString(query, "inStock") === "1",
    priceMin: readQueryNumber(query, "priceMin"),
    priceMax: readQueryNumber(query, "priceMax"),
  };
}

export function exploreFiltersToRouteQuery(
  filters: ExploreRouteFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.categoryId !== ALL_EXPLORE_CATEGORIES_ID) {
    query.category = filters.categoryId;
  }

  if (filters.inStockOnly) {
    query.inStock = "1";
  }

  if (filters.priceMin != null) {
    query.priceMin = String(filters.priceMin);
  }

  if (filters.priceMax != null) {
    query.priceMax = String(filters.priceMax);
  }

  return query;
}

export function mergeExploreRouteQuery(
  current: RouteQuery,
  filters: ExploreRouteFilters,
): Record<string, string | string[] | undefined> {
  const next: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(current)) {
    if (Array.isArray(value)) {
      const values = value.filter(
        (item): item is string => typeof item === "string",
      );
      if (values.length > 0) {
        next[key] = values;
      }
      continue;
    }

    if (typeof value === "string") {
      next[key] = value;
    }
  }

  delete next.category;
  delete next.inStock;
  delete next.priceMin;
  delete next.priceMax;

  return {
    ...next,
    ...exploreFiltersToRouteQuery(filters),
  };
}
