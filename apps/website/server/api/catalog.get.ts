/**
 * Live catalog feed for the "GoSource on the go" phone simulation.
 *
 * Fetches the normalized catalog from the customer app's public proxy (configured via
 * `NUXT_CATALOG_API_URL`), and returns categories — each with a trimmed, display-ready
 * product list. Runs on the server (no CORS, upstream URL stays off the client). Returns
 * an empty list on failure so the phone frame falls back to its static demo data.
 */

interface RawUnitChoice {
  priceNaira?: number;
  discountedPriceNaira?: number | null;
}

interface RawProduct {
  name?: string;
  imageUrl?: string;
  priceNaira?: number;
  inStock?: boolean;
  unitChoices?: RawUnitChoice[];
}

interface RawCategory {
  title?: string;
  emoji?: string;
  imageUrl?: string;
  products?: RawProduct[];
}

interface CatalogResponse {
  data?: RawCategory[];
}

export interface SimProduct {
  name: string;
  image: string;
  price: string;
  oldPrice?: string;
  badge?: string;
}

export interface SimCategory {
  title: string;
  emoji: string;
  image: string;
  products: SimProduct[];
}

const MAX_CATEGORIES = 8;
const MAX_PRODUCTS_PER_CATEGORY = 14;

const nairaFormatter = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

function formatNaira(amount: number): string {
  return `₦${nairaFormatter.format(Math.round(amount))}`;
}

/** Lowest sellable price across a product's units (the "from" / small price), with any struck original. */
function resolvePricing(product: RawProduct): { price: number; original?: number } | null {
  const units = (product.unitChoices ?? []).filter(
    (unit) => typeof unit.priceNaira === 'number' && unit.priceNaira! > 0,
  );

  const candidates =
    units.length > 0
      ? units.map((unit) => {
          const base = unit.priceNaira!;
          const discounted =
            typeof unit.discountedPriceNaira === 'number' && unit.discountedPriceNaira > 0
              ? unit.discountedPriceNaira
              : null;
          const effective = discounted && discounted < base ? discounted : base;
          return { price: effective, original: discounted && discounted < base ? base : undefined };
        })
      : typeof product.priceNaira === 'number' && product.priceNaira > 0
        ? [{ price: product.priceNaira, original: undefined }]
        : [];

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((lowest, current) => (current.price < lowest.price ? current : lowest));
}

function toSimProduct(product: RawProduct): SimProduct | null {
  if (product.inStock === false || !product.name || !product.imageUrl) {
    return null;
  }

  const pricing = resolvePricing(product);
  if (!pricing) {
    return null;
  }

  const percent = pricing.original
    ? Math.round((1 - pricing.price / pricing.original) * 100)
    : 0;

  return {
    name: product.name,
    image: product.imageUrl,
    price: formatNaira(pricing.price),
    ...(pricing.original ? { oldPrice: formatNaira(pricing.original) } : {}),
    ...(percent > 0 ? { badge: `${percent}% off` } : {}),
  };
}

// Cached server-side + emits Cache-Control, so reloads within the TTL are instant (no
// refetch). Upstream failures throw (rather than caching an empty list) so the frame
// falls back to its static demo and the next request retries.
export default defineCachedEventHandler(
  async (event): Promise<SimCategory[]> => {
    const { catalogApiUrl } = useRuntimeConfig(event);

    const response = await $fetch<CatalogResponse>(catalogApiUrl, {
      timeout: 8000,
      headers: { accept: 'application/json' },
    });

    const categories: SimCategory[] = [];

    for (const category of response?.data ?? []) {
      if (categories.length >= MAX_CATEGORIES) {
        break;
      }

      const products: SimProduct[] = [];
      for (const product of category.products ?? []) {
        if (products.length >= MAX_PRODUCTS_PER_CATEGORY) {
          break;
        }
        const mapped = toSimProduct(product);
        if (mapped) {
          products.push(mapped);
        }
      }

      if (products.length === 0) {
        continue;
      }

      categories.push({
        title: category.title ?? 'Products',
        emoji: category.emoji || '🛒',
        image: category.imageUrl ?? '',
        products,
      });
    }

    if (categories.length === 0) {
      throw createError({ statusCode: 502, statusMessage: 'Empty catalog' });
    }

    return categories;
  },
  { maxAge: 600, swr: true, name: 'sim-catalog', getKey: () => 'sim-catalog' },
);
