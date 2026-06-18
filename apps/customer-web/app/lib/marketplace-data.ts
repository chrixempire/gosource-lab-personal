export type MarketUnitChoice = {
  name: string;
  measure?: string;
  priceNaira: number;
  discountedPriceNaira?: number;
};

export function hasUnitSalePrice(choice: MarketUnitChoice): boolean {
  return (
    choice.discountedPriceNaira !== undefined &&
    choice.discountedPriceNaira < choice.priceNaira
  );
}

export type MarketProductPromotion = {
  discountValue: number;
  isPercentageDiscounted: boolean;
};

export type MarketProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  /** Active promotion discount badge (legacy `product.promotion`). */
  promotion?: MarketProductPromotion;
  /** Richer copy for modal / product page */
  longDescription?: string;
  /** Shown as “Brand: …” in product UI */
  brandLabel?: string;
  priceNaira: number;
  compareAtNaira?: number;
  discountPct?: number;
  unit?: string;
  /** Short badge next to unit row, e.g. “1 kg = ₦ 4,700.00” */
  unitPriceBadge?: string;
  stockNote?: string;
  /** Parsed per-unit purchase options from legacy `unit` / `discountedUnit` maps. */
  unitChoices?: MarketUnitChoice[];
  /** Optional purchase units shown in add modal */
  unitOptions?: string[];
  /** Explicit legacy stock flag; missing means available for older payloads. */
  inStock?: boolean;
  /** Legacy mock-only placeholder styling; not required for live backend data. */
  imageGradient?: string;
};

export type MarketCategory = {
  id: string;
  title: string;
  emoji: string;
  imageUrl?: string;
  sectionTitle: string;
  sectionDescription: string;
  merchantLabel?: string;
  products: MarketProduct[];
};

export function categoriesWithProducts(categories: MarketCategory[] | null | undefined): MarketCategory[] {
  return (categories ?? []).filter((category) => (category.products?.length ?? 0) > 0);
}

export type MarketPromotion = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isPercentageDiscounted: boolean;
  discountValue: number;
  products: MarketProduct[];
};

export type MarketPromotionsResponse = {
  status?: boolean;
  message?: string;
  data: MarketPromotion[];
};

export type MarketRecentOrdersResponse = {
  status?: boolean;
  message?: string;
  data: MarketProduct[];
};

export type MarketCategoriesResponse = {
  status?: boolean;
  message?: string;
  data: MarketCategory[];
};

export type MarketCategoryResponse = {
  status?: boolean;
  message?: string;
  data: MarketCategory;
};

export type MarketProductResponse = {
  status?: boolean;
  message?: string;
  data: MarketProduct;
};

export type MarketCartItem = {
  id: string;
  productId: string;
  branchId?: string;
  unit: string;
  quantity: number;
  product?: MarketProduct;
  lineTotalNaira: number;
};

export type MarketCartData = {
  totalPrice: number;
  cartItems: MarketCartItem[];
  count: number;
};

export type MarketCartResponse = {
  status?: boolean | string;
  message?: string;
  data: MarketCartData;
};

export type MarketCartMutationResponse = {
  status?: boolean | string;
  message?: string;
  data: MarketCartItem | null;
};

export const MARKETPLACE_CATEGORIES: MarketCategory[] = [
  {
    id: 'fruits-veg',
    title: 'Fruits and vegetables',
    emoji: '🍎',
    sectionTitle: 'Fresh and in-season',
    sectionDescription: "At America's Food Basket",
    merchantLabel: "America's",
    products: [
      {
        id: 'spinach',
        name: 'Fresh Express Spinach',
        description: 'Triple-washed baby spinach',
        brandLabel: 'Fresh Express',
        longDescription:
          'Triple-washed baby spinach, ready to toss into salads, smoothies, or sautés. Crisp leaves, mild flavour, and consistent quality — ideal for weekly meal prep.',
        priceNaira: 1850,
        compareAtNaira: 2650,
        discountPct: 30,
        unit: '8 oz',
        unitOptions: ['8 oz', '16 oz (2×)', 'Case of 6'],
        stockNote: 'Many in stock',
        imageGradient: 'from-emerald-600/90 to-emerald-800',
      },
      {
        id: 'strawberries',
        name: "Driscoll's Strawberries",
        description: 'Sweet California strawberries',
        priceNaira: 3200,
        compareAtNaira: 3750,
        discountPct: 15,
        unit: '16 oz',
        imageGradient: 'from-rose-500/85 to-red-700',
      },
      {
        id: 'mango',
        name: 'Red Mango',
        description: 'Ripe Ataulfo mango',
        priceNaira: 890,
        unit: '1 each',
        imageGradient: 'from-amber-400 to-orange-600',
      },
      {
        id: 'plum',
        name: 'Black Plum',
        description: 'Sold by weight — price estimated',
        priceNaira: 520,
        unit: '~0.31 lb (est.)',
        stockNote: '₦1,680 / lb',
        imageGradient: 'from-violet-700 to-purple-900',
      },
      {
        id: 'asparagus',
        name: 'Asparagus',
        description: 'Fresh green spears',
        priceNaira: 3200,
        unit: '1 bunch',
        stockNote: 'Many in stock',
        imageGradient: 'from-lime-600 to-green-800',
      },
    ],
  },
  {
    id: 'frozen',
    title: 'Frozen foods',
    emoji: '🧊',
    sectionTitle: 'Frozen favourites',
    sectionDescription: 'Quick meals and ingredients kept at peak freshness.',
    products: [
      {
        id: 'frozen-mix',
        name: 'Mixed vegetables',
        description: 'Peas, carrots, corn and beans',
        brandLabel: 'Arctic Garden',
        longDescription:
          'A colourful blend of peas, carrots, corn, and green beans — flash-frozen at peak ripeness so nutrients and texture stay locked in. Perfect for stir-fries, soups, and quick sides.',
        unitPriceBadge: '1 kg = ₦890.00',
        priceNaira: 890,
        unit: '1 kg',
        imageGradient: 'from-sky-500 to-blue-800',
      },
      {
        id: 'ice-cream',
        name: 'Vanilla ice cream',
        description: 'Creamy classic tub',
        priceNaira: 2450,
        compareAtNaira: 2800,
        discountPct: 12,
        unit: '1.5 L',
        imageGradient: 'from-indigo-200 to-indigo-400',
      },
    ],
  },
  {
    id: 'canned',
    title: 'Canned foods',
    emoji: '🥫',
    sectionTitle: 'Pantry staples',
    sectionDescription: 'Beans, tomatoes, soups and more.',
    products: [
      {
        id: 'baked-beans',
        name: 'Baked beans in tomato sauce',
        description: 'High in fibre',
        priceNaira: 450,
        unit: '420 g',
        imageGradient: 'from-amber-700 to-amber-900',
      },
    ],
  },
  {
    id: 'spices',
    title: 'Spices and seasonings',
    emoji: '🧂',
    sectionTitle: 'Bold flavours',
    sectionDescription: 'Curry blends, pepper and herbs.',
    products: [
      {
        id: 'curry-powder',
        name: 'Curry powder',
        description: 'Mild aromatic blend',
        priceNaira: 620,
        unit: '100 g',
        imageGradient: 'from-yellow-600 to-amber-800',
      },
      {
        id: 'black-pepper',
        name: 'Black pepper grinder',
        description: 'Whole corns, refillable',
        priceNaira: 1100,
        unit: '45 g',
        imageGradient: 'from-stone-600 to-stone-900',
      },
    ],
  },
  {
    id: 'oils',
    title: 'Oils',
    emoji: '🫒',
    sectionTitle: 'Cooking oils',
    sectionDescription: 'Vegetable, olive and specialty oils.',
    products: [
      {
        id: 'veg-oil',
        name: 'Vegetable oil',
        description: 'Light everyday cooking',
        priceNaira: 3200,
        unit: '5 L',
        imageGradient: 'from-yellow-300 to-yellow-500',
      },
    ],
  },
  {
    id: 'packaging',
    title: 'Packaging materials',
    emoji: '📦',
    sectionTitle: 'Boxes & bags',
    sectionDescription: 'For storage and takeaway.',
    products: [
      {
        id: 'takeaway-box',
        name: 'Kraft takeaway boxes',
        description: 'Pack of 25',
        priceNaira: 5500,
        unit: '25 pcs',
        imageGradient: 'from-orange-300 to-amber-700',
      },
    ],
  },
  {
    id: 'dairy',
    title: 'Dairy and eggs',
    emoji: '🥚',
    sectionTitle: 'Dairy & eggs',
    sectionDescription: 'Milk, cheese, yoghurt and fresh eggs.',
    products: [
      {
        id: 'eggs',
        name: 'Large brown eggs',
        description: 'Cage-free, grade A',
        priceNaira: 890,
        unit: '12 count',
        imageGradient: 'from-amber-100 to-amber-300',
      },
    ],
  },
  {
    id: 'paperware',
    title: 'Paperware and disposables',
    emoji: '🧻',
    sectionTitle: 'Disposables',
    sectionDescription: 'Plates, cups and napkins.',
    products: [
      {
        id: 'plates',
        name: 'Paper plates 9"',
        description: 'Sturdy pack',
        priceNaira: 1200,
        unit: '50 pcs',
        imageGradient: 'from-slate-200 to-slate-400',
      },
    ],
  },
  {
    id: 'stationery',
    title: 'Stationery',
    emoji: '✏️',
    sectionTitle: 'Office basics',
    sectionDescription: 'Pens, paper and school supplies.',
    products: [
      {
        id: 'notebook',
        name: 'Spiral notebook',
        description: 'Ruled, 80 pages',
        priceNaira: 350,
        unit: '1 each',
        imageGradient: 'from-blue-200 to-blue-500',
      },
    ],
  },
  {
    id: 'sauces',
    title: 'Sauces',
    emoji: '🍅',
    sectionTitle: 'Sauces & condiments',
    sectionDescription: 'Ketchup, mayo, hot sauce and more.',
    products: [
      {
        id: 'ketchup',
        name: 'Tomato ketchup',
        description: 'Classic table bottle',
        priceNaira: 720,
        unit: '500 ml',
        imageGradient: 'from-red-600 to-red-900',
      },
    ],
  },
  {
    id: 'utensils',
    title: 'Utensils',
    emoji: '🥄',
    sectionTitle: 'Kitchen tools',
    sectionDescription: 'Spoons, spatulas and gadgets.',
    products: [
      {
        id: 'ladle',
        name: 'Silicone ladle',
        description: 'Heat resistant',
        priceNaira: 1850,
        unit: '1 each',
        imageGradient: 'from-pink-300 to-rose-500',
      },
    ],
  },
  {
    id: 'dry-foods',
    title: 'Dry foods',
    emoji: '🍚',
    sectionTitle: 'Grains & pasta',
    sectionDescription: 'Rice, noodles and breakfast cereals.',
    products: [
      {
        id: 'rice',
        name: 'Long grain rice',
        description: 'Parboiled',
        priceNaira: 8900,
        unit: '25 kg',
        imageGradient: 'from-stone-300 to-stone-500',
      },
    ],
  },
  {
    id: 'dry-fish',
    title: 'Dry Fish',
    emoji: '🐟',
    sectionTitle: 'Dried seafood',
    sectionDescription: 'Stockfish and smoked cuts.',
    products: [
      {
        id: 'stockfish',
        name: 'Stockfish fillet',
        description: 'Traditional dried cod',
        brandLabel: 'Nordic Catch',
        longDescription:
          'Traditional dried cod fillet, lightly salted and air-dried for deep umami flavour. Soak before cooking for soups, stews, and classic regional dishes — sealed for freshness.',
        unitPriceBadge: '500 g = ₦4,500.00',
        priceNaira: 4500,
        unit: '500 g',
        imageGradient: 'from-slate-600 to-slate-800',
      },
    ],
  },
  {
    id: 'drinks',
    title: 'Drinks',
    emoji: '🥤',
    sectionTitle: 'Beverages',
    sectionDescription: 'Juice, soda and water.',
    products: [
      {
        id: 'water',
        name: 'Spring water',
        description: 'Still, multipack',
        priceNaira: 1200,
        unit: '6 × 1.5 L',
        imageGradient: 'from-cyan-400 to-blue-600',
      },
    ],
  },
];

function getCatalogCategories(): MarketCategory[] {
  try {
    const categories = useState<MarketCategory[]>('market-categories', () => []);
    return Array.isArray(categories.value) ? categories.value : [];
  } catch {
    return [];
  }
}

/** Separates product id and unit label in cart line keys (must not appear in ids). */
export const CART_LINE_UNIT_SEP = '\u001e';

export function cartLineKey(productId: string, unit: string): string {
  return `${productId}${CART_LINE_UNIT_SEP}${unit}`;
}

export function parseCartLineKey(lineKey: string): { productId: string; unit: string } | null {
  const i = lineKey.indexOf(CART_LINE_UNIT_SEP);
  if (i <= 0) {
    return null;
  }
  return { productId: lineKey.slice(0, i), unit: lineKey.slice(i + CART_LINE_UNIT_SEP.length) };
}

/** Units shown in modal / PDP (from `unitOptions`, or a single default from `unit`). */
export function effectiveUnitChoices(p: MarketProduct): string[] {
  if (p.unitChoices?.length) {
    return p.unitChoices.map((choice) => choice.name);
  }
  if (p.unitOptions?.length) {
    return [...p.unitOptions];
  }
  return [p.unit ?? 'Standard pack'];
}

/** More than one purchasable unit (cart tracks each unit separately). */
export function isMultiUnitProduct(p: MarketProduct): boolean {
  return Boolean(p.unitOptions && p.unitOptions.length > 1);
}

export function isMarketProductInStock(p?: MarketProduct | null): boolean {
  return p?.inStock !== false;
}

/** Prefer cart/API product stock; fall back to catalog when embedded product is missing. */
export function isCartLineInStock(line: MarketCartItem): boolean {
  if (line.product) {
    return line.product.inStock !== false;
  }

  const catalogProduct = getMarketProductById(line.productId);
  if (catalogProduct) {
    return isMarketProductInStock(catalogProduct);
  }

  return true;
}

export function defaultUnitForProduct(p: MarketProduct): string {
  return effectiveUnitChoices(p)[0] ?? 'Standard pack';
}

export function getMeasureShortHand(key: string): string {
  const measureMap: Record<string, string> = {
    kilogram: 'kg',
    gram: 'g',
    pack: 'pack',
    pieces: 'pcs',
  };

  return measureMap[key.toLowerCase()] || '';
}

function normalizeUnitKey(value: string) {
  return value.trim().toLowerCase();
}

export function getMarketUnitChoice(
  product: MarketProduct,
  unitName?: string,
): MarketUnitChoice | undefined {
  const chosenUnit = unitName || defaultUnitForProduct(product);
  if (product.unitChoices?.length) {
    const normalizedChosen = normalizeUnitKey(chosenUnit);
    return product.unitChoices.find(
      (choice) => normalizeUnitKey(choice.name) === normalizedChosen,
    );
  }

  const fallbackUnit = chosenUnit || product.unit || 'Standard pack';
  return {
    name: fallbackUnit,
    measure: getMeasureShortHand(fallbackUnit),
    priceNaira: product.compareAtNaira ?? product.priceNaira,
    discountedPriceNaira:
      product.compareAtNaira && product.compareAtNaira > product.priceNaira
        ? product.priceNaira
        : undefined,
  };
}

export function getMarketUnitPrice(product: MarketProduct, unitName?: string): number {
  const choice = getMarketUnitChoice(product, unitName);
  if (!choice) {
    return product.priceNaira;
  }

  return choice.discountedPriceNaira ?? choice.priceNaira;
}

function getRegisteredMarketProducts(): Record<string, MarketProduct> {
  try {
    return useState<Record<string, MarketProduct>>('market-product-registry', () => ({})).value;
  } catch {
    return {};
  }
}

/** Keep product payloads available for guest cart when not yet in category catalog. */
export function registerMarketProduct(product: MarketProduct) {
  if (!product.id) {
    return;
  }

  const registry = useState<Record<string, MarketProduct>>('market-product-registry', () => ({}));
  registry.value = { ...registry.value, [product.id]: product };
}

export function getMarketProductById(id: string): MarketProduct | undefined {
  const registered = getRegisteredMarketProducts()[id];
  if (registered) {
    return registered;
  }

  for (const cat of getCatalogCategories()) {
    const product = cat.products.find((item) => item.id === id);
    if (product) {
      return product;
    }
  }

  return undefined;
}

export function getMarketCategoryById(id: string): MarketCategory | undefined {
  return getCatalogCategories().find((c) => c.id === id);
}

export function findProductCategoryId(productId: string): string | undefined {
  for (const cat of getCatalogCategories()) {
    if (cat.products.some((p) => p.id === productId)) {
      return cat.id;
    }
  }
}

/**
 * Same-category neighbours for “Similar products” (excludes the current product).
 */
export function getSimilarProducts(productId: string, limit = 8): MarketProduct[] {
  const catId = findProductCategoryId(productId);
  if (!catId) {
    return [];
  }
  const cat = getCatalogCategories().find((c) => c.id === catId);
  if (!cat) {
    return [];
  }
  return cat.products.filter((p) => p.id !== productId).slice(0, limit);
}
