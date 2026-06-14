import { calculateTotalPrice } from '../../utils/helpers';
import { CouponCategory, CouponType, DiscountTarget } from './coupon.enum';

export type CouponApplyContext = {
  orderCount: number;
  cartSubtotal: number;
  now?: Date;
};

function resolvePricingProduct(item: any) {
  if (item?.cartProduct && typeof item.cartProduct === 'object') {
    return item.cartProduct;
  }

  if (item?.product && typeof item.product === 'object') {
    return item.product;
  }

  return null;
}

export function getCartLineProductId(item: any): string | null {
  const product = resolvePricingProduct(item);
  if (product?._id) {
    return String(product._id);
  }

  if (product?.id) {
    return String(product.id);
  }

  if (item?.product) {
    return String(item.product);
  }

  return null;
}

export function isScopedItemCoupon(coupon: { category?: string | null }): boolean {
  const category = String(coupon.category ?? '');
  return (
    category === CouponCategory.AMOUNT_OFF_ITEMS ||
    category === CouponCategory.AMOUNT_OFF_CATEGORY ||
    category === 'amount_off_items' ||
    category === 'amount_off_category'
  );
}

export function couponRequiresMinimumOrder(coupon: {
  category?: string | null;
  type?: string | null;
}): boolean {
  const category = String(coupon.category ?? '');
  return (
    category === CouponCategory.AMOUNT_OFF_ORDERS ||
    category === CouponCategory.FREE_DELIVERY ||
    category === 'amount_off_orders' ||
    category === 'free_delivery' ||
    coupon.type === CouponType.FREE_DELIVERY
  );
}

export function calculateEligibleSubtotal(
  cartItems: any[],
  businessId: string,
  applicableProductIds?: string[] | null,
): number {
  if (!applicableProductIds?.length) {
    return calculateTotalPrice(cartItems, businessId);
  }

  const allowed = new Set(applicableProductIds.map((id) => String(id)));
  const eligibleItems = cartItems.filter((item) => {
    const productId = getCartLineProductId(item);
    return productId ? allowed.has(productId) : false;
  });

  return calculateTotalPrice(eligibleItems, businessId);
}

export function resolveEligibleSubtotal(
  coupon: { category?: string | null; applicableItems?: string[] | null },
  cartItems: any[],
  businessId: string,
): number {
  if (isScopedItemCoupon(coupon)) {
    return calculateEligibleSubtotal(
      cartItems,
      businessId,
      coupon.applicableItems ?? [],
    );
  }

  return calculateTotalPrice(cartItems, businessId);
}

export function computeDiscountAmount(
  coupon: { type?: string | null; discount?: number | null },
  eligibleSubtotal: number,
): number {
  if (eligibleSubtotal <= 0) {
    return 0;
  }

  if (coupon.type === CouponType.FIXED_AMOUNT) {
    return Math.min(Number(coupon.discount ?? 0), eligibleSubtotal);
  }

  if (coupon.type === CouponType.PERCENTAGE) {
    return Math.round((Number(coupon.discount ?? 0) / 100) * eligibleSubtotal);
  }

  return 0;
}

export function assertCouponSchedule(
  coupon: {
    isActive?: boolean | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    expiryDate?: Date | string | null;
  },
  now = new Date(),
): void {
  if (coupon.isActive === false) {
    throw new Error('Coupon is not active');
  }

  if (coupon.startDate && new Date(coupon.startDate) > now) {
    throw new Error('Coupon is not active yet');
  }

  const endsAt = coupon.endDate ?? coupon.expiryDate;
  if (endsAt && new Date(endsAt) < now) {
    throw new Error('Coupon has expired');
  }
}

export function assertCouponUsageLimit(
  coupon: { usageLimit?: number | null; usageCount?: number | null },
): void {
  const usageLimit = Number(coupon.usageLimit ?? -1);
  const usageCount = Number(coupon.usageCount ?? 0);

  if (usageLimit > 0 && usageCount >= usageLimit) {
    throw new Error('Coupon usage limit has been reached');
  }
}

export function assertCouponAudience(
  coupon: {
    target?: string | null;
    isFirstTimeUserOnly?: boolean | null;
    code?: string | null;
  },
  orderCount: number,
): void {
  const isFirstTime = orderCount === 0;
  const normalizedCode = String(coupon.code ?? '').toUpperCase();

  if (coupon.isFirstTimeUserOnly && !isFirstTime) {
    throw new Error('Coupon can only be used by first time users');
  }

  if (coupon.target === DiscountTarget.NEW && !isFirstTime) {
    throw new Error('Coupon can only be used by first time users');
  }

  if (coupon.target === DiscountTarget.OLD && isFirstTime) {
    throw new Error('Coupon is only available to returning customers');
  }

  const legacyFirstTimeCodes = new Set([
    'EASTER5',
    'EASTER10',
    'WELCOME5',
    'GOSOURCE5',
    'GOSOURCE5',
  ]);

  if (legacyFirstTimeCodes.has(normalizedCode) && !isFirstTime) {
    throw new Error('Coupon can only be used by first time users');
  }
}

export function assertMinimumOrderAmount(
  coupon: { minimumOrderAmount?: number | null },
  cartSubtotal: number,
): void {
  const minimumOrderAmount = Number(coupon.minimumOrderAmount ?? 0);
  if (minimumOrderAmount > 0 && cartSubtotal < minimumOrderAmount) {
    throw new Error(
      `Order subtotal must be at least ${minimumOrderAmount} to use this coupon`,
    );
  }
}

export function assertCouponCanBeApplied(
  coupon: {
    category?: string | null;
    type?: string | null;
    isActive?: boolean | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    expiryDate?: Date | string | null;
    usageLimit?: number | null;
    usageCount?: number | null;
    target?: string | null;
    isFirstTimeUserOnly?: boolean | null;
    code?: string | null;
    minimumOrderAmount?: number | null;
    applicableItems?: string[] | null;
  },
  context: CouponApplyContext,
): void {
  assertCouponSchedule(coupon, context.now);
  assertCouponUsageLimit(coupon);
  assertCouponAudience(coupon, context.orderCount);

  if (couponRequiresMinimumOrder(coupon)) {
    assertMinimumOrderAmount(coupon, context.cartSubtotal);
  }

  if (
    coupon.type !== CouponType.FREE_DELIVERY &&
    coupon.type !== CouponType.FIXED_AMOUNT &&
    coupon.type !== CouponType.PERCENTAGE
  ) {
    throw new Error('This coupon type is not supported at checkout');
  }

  if (isScopedItemCoupon(coupon) && !(coupon.applicableItems?.length ?? 0)) {
    throw new Error('Coupon is missing eligible products');
  }
}
