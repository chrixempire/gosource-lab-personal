export type ProductListFilters = {
  name: string;
  category: string[];
  productStatus: string[];
  inStock: string[];
  page: number;
  limit: number;
};

export type CategoryListFilters = {
  filterBy: string;
  filterValue: string;
  page: number;
  limit: number;
};

export type InventoryTableMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type LegacyProductRow = {
  _id: string;
  name?: string;
  description?: string;
  totalPrice?: number;
  discountPrice?: number;
  marketPrice?: number;
  quantity?: number;
  unit?: string | Record<string, unknown> | Array<unknown>;
  discountedUnit?: string | Record<string, unknown>;
  purchaseUnit?: string;
  actualPrice?: number;
  version?: string;
  inStock?: boolean;
  isLowStock?: boolean;
  active?: boolean;
  trackQuantity?: boolean;
  lowStockLevel?: number | string;
  brand?: string;
  images?: Array<{ url?: string; id?: string }>;
  newUnit?: string | unknown[];
  specialPrices?: Array<Record<string, unknown>> | Record<string, unknown>;
  category?: { _id?: string; name?: string } | string;
  promotion?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductStockAlert = {
  label: string;
  variant: 'negative' | 'warning';
};

export type AdminProductListItem = {
  id: string;
  name: string;
  description: string;
  categoryLabel: string;
  priceLabel: string;
  compareAtPriceLabel: string | null;
  quantityLabel: string;
  purchaseUnitLabel: string;
  /** Raw purchase unit from API — used to prefill stock dialogs. */
  purchaseUnit: string;
  stockAlert: ProductStockAlert | null;
  unitCountLabel: string;
  inStock: boolean;
  active: boolean;
  statusLabel: string;
  statusVariant: 'success' | 'negative' | 'warning' | 'default';
  imageUrl: string | null;
  marketPrice: number;
  /** Present when the product document has an assigned promotion. */
  hasPromotion: boolean;
  promotionId: string | null;
};

export type LegacyCategoryRow = {
  _id: string;
  name?: string;
  desc?: string;
  image?: string;
  productCount?: number;
  position?: number;
  createdAt?: string;
};

export type AdminCategoryListItem = {
  id: string;
  name: string;
  description: string;
  productCount: number;
  productCountLabel: string;
  position: number;
  imageUrl: string | null;
};

export type AdminCategoryDetailsView = {
  id: string;
  name: string;
  description: string;
  productCount: number;
  position: number;
  imageUrl: string | null;
  createdAtLabel: string | null;
};

export type ProductUnitOption = {
  id: string;
  label: string;
  slug: string;
};

export type CategoryOption = {
  id: string;
  label: string;
  imageUrl?: string | null;
};
