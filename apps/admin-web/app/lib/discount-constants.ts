import type { DiscountRouteSlug, DiscountStatus } from '~/types/discounts';

export const DISCOUNT_ROUTE_SLUGS: Record<DiscountRouteSlug, string> = {
  amountOffCategory: 'amount_off_category',
  amountOffProduct: 'amount_off_items',
  amountOffOrder: 'amount_off_orders',
  freeDelivery: 'free_delivery',
};

export const DISCOUNT_ROUTE_LABELS: Record<DiscountRouteSlug, string> = {
  amountOffCategory: 'Amount off category',
  amountOffProduct: 'Amount off items',
  amountOffOrder: 'Amount off order',
  freeDelivery: 'Free delivery',
};

export const DISCOUNT_CREATE_OPTIONS = [
  {
    slug: 'amountOffCategory' as DiscountRouteSlug,
    label: 'Amount off category',
    snippet: 'Discount all items in a selected category.',
  },
  {
    slug: 'amountOffProduct' as DiscountRouteSlug,
    label: 'Amount off items',
    snippet: 'Discount specific products.',
  },
  {
    slug: 'amountOffOrder' as DiscountRouteSlug,
    label: 'Amount off order',
    snippet: 'Discount the entire order subtotal.',
  },
  {
    slug: 'freeDelivery' as DiscountRouteSlug,
    label: 'Free delivery',
    snippet: 'Waive delivery fees above a minimum order.',
  },
];

export const DISCOUNT_CATEGORY_LABELS: Record<string, string> = {
  amount_off_category: 'Amount off category',
  amount_off_items: 'Amount off items',
  amount_off_orders: 'Amount off order',
  free_delivery: 'Free delivery',
  buy_one_get_one: 'Buy one get one',
  combo_deal: 'Combo deal',
  loyalty_points: 'Loyalty points',
};

export const DISCOUNT_AMOUNT_TYPE_OPTIONS = [
  { value: 'FIXED_AMOUNT', label: 'Fixed amount', snippet: 'Removes a fixed amount' },
  { value: 'PERCENTAGE', label: 'Percentage', snippet: 'Removes a percentage' },
];

export const DISCOUNT_TARGET_OPTIONS = [
  { value: 'all', label: 'All customers' },
  { value: 'new', label: 'New customers' },
  { value: 'old', label: 'Returning customers' },
];

export const DISCOUNT_STATUS_OPTIONS: {
  value: DiscountStatus;
  label: string;
  variant: 'success' | 'warning' | 'default' | 'completed' | 'info';
}[] = [
  { value: 'active', label: 'Active', variant: 'success' },
  { value: 'inactive', label: 'Inactive', variant: 'default' },
  { value: 'expired', label: 'Expired', variant: 'warning' },
  { value: 'deactivated', label: 'Deactivated', variant: 'default' },
  { value: 'used', label: 'Used', variant: 'info' },
];

export const DISCOUNT_QUICK_STATUS_FILTERS: { key: DiscountStatus | 'all'; label: string }[] =
  [
    { key: 'all', label: 'All discounts' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'expired', label: 'Expired' },
    { key: 'deactivated', label: 'Deactivated' },
  ];

export const DISCOUNT_FILTER_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FIXED_AMOUNT', label: 'Fixed amount' },
  { value: 'FREE_DELIVERY', label: 'Free delivery' },
];

export function discountStatusLabel(status: string) {
  return DISCOUNT_STATUS_OPTIONS.find((entry) => entry.value === status)?.label ?? status;
}

export function discountStatusVariant(status: string) {
  return DISCOUNT_STATUS_OPTIONS.find((entry) => entry.value === status)?.variant ?? 'default';
}

export function slugFromRouteParam(param: string): DiscountRouteSlug | null {
  const map: Record<string, DiscountRouteSlug> = {
    amountOffCategory: 'amountOffCategory',
    amountOffProduct: 'amountOffProduct',
    amountOffOrder: 'amountOffOrder',
    freeDelivery: 'freeDelivery',
  };
  return map[param] ?? null;
}

export function routeParamFromSlug(slug: DiscountRouteSlug) {
  return slug;
}
