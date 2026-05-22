import type { MarketCategory, MarketProduct } from '~/lib/marketplace-data';

export type MarketSearchProductHit = {
  product: MarketProduct;
  category: MarketCategory;
};

export type MarketSearchResults = {
  categories: MarketCategory[];
  products: MarketSearchProductHit[];
};

const MIN_QUERY_LENGTH = 2;

export function searchMarketCatalog(
  categories: MarketCategory[] | null | undefined,
  query: string,
): MarketSearchResults {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_QUERY_LENGTH) {
    return { categories: [], products: [] };
  }

  const categoryHits: MarketCategory[] = [];
  const productHits: MarketSearchProductHit[] = [];
  const seenCategoryIds = new Set<string>();
  const seenProductIds = new Set<string>();

  for (const category of categories ?? []) {
    const title = category.title.toLowerCase();
    const section = category.sectionTitle?.toLowerCase() ?? '';

    if ((title.includes(normalized) || section.includes(normalized)) && !seenCategoryIds.has(category.id)) {
      seenCategoryIds.add(category.id);
      categoryHits.push(category);
    }

    for (const product of category.products ?? []) {
      if (!product.name.toLowerCase().includes(normalized) || seenProductIds.has(product.id)) {
        continue;
      }

      seenProductIds.add(product.id);
      productHits.push({ product, category });
    }
  }

  return { categories: categoryHits, products: productHits };
}

export function hasMarketSearchQuery(query: string) {
  return query.trim().length >= MIN_QUERY_LENGTH;
}
