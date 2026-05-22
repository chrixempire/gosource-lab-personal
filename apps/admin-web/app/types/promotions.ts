export type PromotionStatus = 'active' | 'inactive' | 'expired' | 'deactivated';

export type PromotionListFilters = {
  name: string;
  status: PromotionStatus[];
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
};

export type LegacyPromotionRow = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  startDate?: string;
  endDate?: string;
  isPercentageDiscounted?: boolean;
  discountValue?: number;
  isActive?: boolean;
  isDeactivatedManually?: boolean;
  products?: Array<{ _id?: string; id?: string; name?: string; images?: Array<{ url?: string }>; promotion?: unknown } | string>;
  usageCount?: number;
  createdAt?: string;
};

export type AdminPromotionListItem = {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  itemsCount: number;
  discountLabel: string;
  status: PromotionStatus;
  statusLabel: string;
  isActive: boolean;
};

export type PromotionFormProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  hasPromotion: boolean;
};

export type PromotionFormValues = {
  name: string;
  description: string;
  icon: string;
  /** Preview tint for the icon picker (not persisted on promotion API). */
  color: string;
  startDate: string;
  endDate: string;
  isPercentageDiscounted: boolean;
  discountPercentage: string;
  productIds: string[];
  products: PromotionFormProduct[];
};

export type PromotionActionMode = 'duplicate' | 'delete' | 'activate' | 'deactivate';

export type PromotionListStats = {
  total: number;
  active: number;
  inactive: number;
  usage: number;
};
