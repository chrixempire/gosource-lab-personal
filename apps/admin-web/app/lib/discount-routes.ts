import type { DiscountRouteSlug } from '~/types/discounts';

export function slugFromCouponCategory(category: string): DiscountRouteSlug {
  if (category === 'amount_off_orders') return 'amountOffOrder';
  if (category === 'free_delivery') return 'freeDelivery';
  if (category === 'amount_off_items') return 'amountOffProduct';
  return 'amountOffCategory';
}
