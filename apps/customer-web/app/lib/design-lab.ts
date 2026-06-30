import type { MarketProduct } from '~/lib/marketplace-data';

export type DesignLabUnit = { name: string; priceNaira: number };

/** Purchasable units for a product. Multi-unit when more than one is returned. */
export function designLabUnits(p: MarketProduct): DesignLabUnit[] {
  if (p.unitChoices?.length) {
    return p.unitChoices.map((u) => ({
      name: u.name,
      priceNaira: u.discountedPriceNaira ?? u.priceNaira,
    }));
  }
  if (p.unitOptions?.length) {
    return p.unitOptions.map((name) => ({ name, priceNaira: p.priceNaira }));
  }
  return [{ name: p.unit || 'Unit', priceNaira: p.priceNaira }];
}

export function designLabIsMultiUnit(p: MarketProduct): boolean {
  return designLabUnits(p).length > 1;
}

// Food/grocery storefront design lab — faithful replicas of how award-winning
// grocery & B2B food platforms build the product card, quick-view modal, and
// product detail page. Cards are wired to REAL GoSource products; a built-in
// food fallback keeps the showcase populated if the catalog can't be reached.

export type Platform = {
  id: string;
  label: string;
  accent: string;
  note: string;
};

// Display order in the showcase switcher.
export const PLATFORMS: Platform[] = [
  { id: 'instacart', label: 'Instacart', accent: '#0AAD0A', note: 'Clean white cards, "+" → qty stepper, price-per-unit' },
  { id: 'gopuff', label: 'Gopuff', accent: '#00A4FF', note: 'Azure blue, fast delivery, rounded "Add" pills' },
  { id: 'getir', label: 'Getir', accent: '#5D3EBC', note: 'Purple + yellow price tags, playful' },
  { id: 'gorillas', label: 'Gorillas', accent: '#D9F154', note: 'Dark near-black + neon lime, bold' },
  { id: 'weee', label: 'Weee!', accent: '#027FFF', note: 'Deal-heavy, red sale prices, blue Add' },
  { id: 'oda', label: 'Oda', accent: '#5B278E', note: 'Award-winning Scandi minimalism, purple' },
  { id: 'amazonfresh', label: 'Amazon Fresh', accent: '#067D62', note: 'Dense, yellow Add pill, Ember type' },
  { id: 'thrive', label: 'Thrive Market', accent: '#EC6E55', note: 'Wellness, member pricing, cream + coral' },
  { id: 'misfits', label: 'Misfits Market', accent: '#2C8440', note: 'Organic, cream bg, forest-green Add pill' },
  { id: 'choco', label: 'Choco (B2B)', accent: '#3D6BFF', note: 'B2B restaurant ordering — supplier list rows' },
  { id: 'ocado', label: 'Ocado', accent: '#4A2D6E', note: 'UK grocery — grape purple, bold price + per-unit' },
  { id: 'flink', label: 'Flink', accent: '#FF2882', note: 'Instant grocery — bold pink, deal badges' },
  { id: 'sprouts', label: 'Sprouts', accent: '#007932', note: 'Farmers market — green on cream surfaces' },
  { id: 'hellofresh', label: 'HelloFresh', accent: '#91C813', note: 'Appetizing, recipe-forward, lime green' },
  { id: 'jumia', label: 'Jumia', accent: '#F68B1E', note: 'Nigerian marketplace — orange, dense, ratings' },
];

const img = (id: string, w = 700) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Built-in food fallback (units like GoSource: bags, cartons, crates, bottles).
export const FALLBACK_PRODUCTS: MarketProduct[] = [
  { id: 'fb-rice', name: 'Mama Gold Parboiled Rice', description: 'Long-grain parboiled rice, premium grade.', categoryName: 'Grains', brandLabel: 'Mama Gold', priceNaira: 78000, compareAtNaira: 85000, discountPct: 8, unit: '50 kg bag', unitPriceBadge: '1 kg = ₦1,560', imageUrl: img('1586201375761-83865001e31c'), inStock: true, unitChoices: [{ name: '50 kg bag', priceNaira: 78000 }, { name: '25 kg bag', priceNaira: 41000 }, { name: 'Per kg', priceNaira: 1700 }] },
  { id: 'fb-oil', name: 'Devon King’s Vegetable Oil', description: 'Pure refined vegetable cooking oil.', categoryName: 'Oils', brandLabel: 'Devon King’s', priceNaira: 42500, unit: '25 L keg', unitPriceBadge: '1 L = ₦1,700', imageUrl: img('1474979266404-7eaacbcd87c5'), inStock: true, unitChoices: [{ name: '25 L keg', priceNaira: 42500 }, { name: '5 L bottle', priceNaira: 9500 }, { name: '1 L bottle', priceNaira: 2100 }] },
  { id: 'fb-tomato', name: 'Gino Tomato Paste', description: 'Rich double-concentrated tomato paste.', categoryName: 'Canned', brandLabel: 'Gino', priceNaira: 19200, compareAtNaira: 21000, discountPct: 9, unit: 'Carton of 50', unitPriceBadge: '1 tin = ₦384', imageUrl: img('1607301405390-d831c242f59b'), inStock: true },
  { id: 'fb-flour', name: 'Honeywell Wheat Flour', description: 'Finely milled all-purpose wheat flour.', categoryName: 'Baking', brandLabel: 'Honeywell', priceNaira: 36000, unit: '50 kg bag', unitPriceBadge: '1 kg = ₦720', imageUrl: img('1509440159596-0249088772ff'), inStock: true, unitChoices: [{ name: '50 kg bag', priceNaira: 36000 }, { name: '10 kg bag', priceNaira: 8200 }] },
  { id: 'fb-eggs', name: 'Fresh Crate Eggs', description: 'Farm-fresh medium eggs.', categoryName: 'Dairy & Eggs', brandLabel: 'FarmFresh', priceNaira: 5200, unit: 'Crate of 30', unitPriceBadge: '1 egg = ₦173', imageUrl: img('1582722872445-44dc5f7e3c8f'), inStock: true },
  { id: 'fb-sugar', name: 'Dangote Granulated Sugar', description: 'Refined white granulated sugar.', categoryName: 'Baking', brandLabel: 'Dangote', priceNaira: 58000, unit: '50 kg bag', unitPriceBadge: '1 kg = ₦1,160', imageUrl: img('1581600140682-d4e68c8cde32'), inStock: true },
  { id: 'fb-milk', name: 'Peak Powdered Milk Sachets', description: 'Instant full-cream milk powder sachets.', categoryName: 'Dairy & Eggs', brandLabel: 'Peak', priceNaira: 24500, compareAtNaira: 27000, discountPct: 9, unit: 'Carton of 120', imageUrl: img('1550583724-b2692b85b150'), inStock: true },
  { id: 'fb-spaghetti', name: 'Golden Penny Spaghetti', description: 'Durum wheat spaghetti.', categoryName: 'Pasta', brandLabel: 'Golden Penny', priceNaira: 14800, unit: 'Carton of 20', unitPriceBadge: '1 pack = ₦740', imageUrl: img('1551462147-ff29053bfc14'), inStock: true },
  { id: 'fb-beans', name: 'Honey Beans (Oloyin)', description: 'Premium brown honey beans.', categoryName: 'Grains', brandLabel: 'FarmFresh', priceNaira: 96000, unit: '50 kg bag', unitPriceBadge: '1 kg = ₦1,920', imageUrl: img('1515543237350-b3eea1ec8082'), inStock: true },
  { id: 'fb-water', name: 'Eva Bottled Water', description: 'Pure table water, 75cl bottles.', categoryName: 'Beverages', brandLabel: 'Eva', priceNaira: 3800, unit: 'Pack of 12', imageUrl: img('1616118132534-381148898bb4'), inStock: false },
  { id: 'fb-salt', name: 'Mr Chef Iodized Salt', description: 'Refined iodized table salt.', categoryName: 'Seasoning', brandLabel: 'Mr Chef', priceNaira: 9600, unit: 'Carton of 24', imageUrl: img('1518110925495-7f6e3a4f6a51'), inStock: true },
  { id: 'fb-noodles', name: 'Indomie Instant Noodles', description: 'Chicken-flavour instant noodles.', categoryName: 'Pasta', brandLabel: 'Indomie', priceNaira: 11200, compareAtNaira: 12500, discountPct: 10, unit: 'Carton of 40', unitPriceBadge: '1 pack = ₦280', imageUrl: img('1612927601601-6638404737ce'), inStock: true },
  { id: 'fb-garri', name: 'Ijebu Garri (Yellow)', description: 'Crisp, sour yellow cassava garri.', categoryName: 'Grains', brandLabel: 'FarmFresh', priceNaira: 31000, unit: '50 kg bag', unitPriceBadge: '1 kg = ₦620', imageUrl: img('1604908176997-125f25cc6f3d'), inStock: true },
  { id: 'fb-palmoil', name: 'Pure Red Palm Oil', description: 'Unrefined traditional red palm oil.', categoryName: 'Oils', brandLabel: 'FarmFresh', priceNaira: 38000, compareAtNaira: 42000, discountPct: 10, unit: '25 L keg', unitPriceBadge: '1 L = ₦1,520', imageUrl: img('1474979266404-7eaacbcd87c5'), inStock: true },
  { id: 'fb-maggi', name: 'Maggi Seasoning Cubes', description: 'Classic seasoning cubes for stocks & stews.', categoryName: 'Seasoning', brandLabel: 'Maggi', priceNaira: 8800, unit: 'Carton of 100', unitPriceBadge: '1 roll = ₦88', imageUrl: img('1596040033229-a9821ebd058d'), inStock: true },
];
