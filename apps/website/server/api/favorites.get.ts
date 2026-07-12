/**
 * Live "Customer favorites" feed for the marketing homepage.
 *
 * Fetches the normalized catalog from the customer app's public proxy (configured via
 * `NUXT_CATALOG_API_URL`), flattens the products, and returns a trimmed, display-ready
 * list. Runs on the server so the browser only ever calls this same-origin route (no CORS)
 * and the upstream URL stays out of the client bundle. On any failure it returns an empty
 * list so the section can fall back to its static defaults.
 */

interface RawUnitChoice {
  priceNaira?: number;
  discountedPriceNaira?: number | null;
}

interface RawProduct {
  id?: string;
  name?: string;
  imageUrl?: string;
  priceNaira?: number;
  inStock?: boolean;
  unitChoices?: RawUnitChoice[];
}

interface RawCategory {
  products?: RawProduct[];
}

interface CatalogResponse {
  data?: RawCategory[];
}

export interface FavoriteProduct {
  name: string;
  image: string;
  price: string;
  oldPrice?: string;
  badge?: string;
}

const MAX_FAVORITES = 10;

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

// Cached server-side + emits Cache-Control, so reloads within the TTL are instant (no
// refetch). Upstream failures throw (rather than caching an empty list) so the section
// falls back to its static defaults and the next request retries.
export default defineCachedEventHandler(
  async (event): Promise<FavoriteProduct[]> => {
    const { catalogApiUrl } = useRuntimeConfig(event);

    const response = await $fetch<CatalogResponse>(catalogApiUrl, {
      timeout: 8000,
      headers: { accept: 'application/json' },
    });

    const products = (response?.data ?? []).flatMap((category) => category.products ?? []);
    const favorites: FavoriteProduct[] = [];

    for (const product of products) {
      if (favorites.length >= MAX_FAVORITES) {
        break;
      }
      if (product.inStock === false || !product.name || !product.imageUrl) {
        continue;
      }

      const pricing = resolvePricing(product);
      if (!pricing) {
        continue;
      }

      favorites.push({
        name: product.name,
        image: product.imageUrl,
        price: formatNaira(pricing.price),
        ...(pricing.original ? { oldPrice: formatNaira(pricing.original) } : {}),
      });
    }

    if (favorites.length === 0) {
      throw createError({ statusCode: 502, statusMessage: 'No favorites available' });
    }

    return favorites;
  },
  { maxAge: 600, swr: true, name: 'sim-favorites', getKey: () => 'sim-favorites' },
);
