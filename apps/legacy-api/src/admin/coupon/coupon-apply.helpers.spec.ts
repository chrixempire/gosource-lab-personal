import {
  assertCouponCanBeApplied,
  assertMinimumOrderAmount,
  computeDiscountAmount,
  couponRequiresMinimumOrder,
  isScopedItemCoupon,
  resolveEligibleSubtotal,
} from './coupon-apply.helpers';
import { CouponCategory, CouponType } from './coupon.enum';

describe('coupon-apply.helpers', () => {
  const businessId = '651ec7953d94128bc73a448a';

  const cartItems = [
    {
      quantity: 2,
      unit: 'pieces',
      cartProduct: {
        _id: 'product-a',
        version: 'v1',
        discountPrice: 1000,
        specialPrices: [],
      },
    },
    {
      quantity: 1,
      unit: 'pieces',
      cartProduct: {
        _id: 'product-b',
        version: 'v1',
        discountPrice: 500,
        specialPrices: [],
      },
    },
  ];

  it('detects scoped item coupons', () => {
    expect(isScopedItemCoupon({ category: CouponCategory.AMOUNT_OFF_ITEMS })).toBe(
      true,
    );
    expect(
      isScopedItemCoupon({ category: CouponCategory.AMOUNT_OFF_CATEGORY }),
    ).toBe(true);
    expect(isScopedItemCoupon({ category: CouponCategory.AMOUNT_OFF_ORDERS })).toBe(
      false,
    );
  });

  it('requires minimum order for order-wide and free delivery coupons', () => {
    expect(
      couponRequiresMinimumOrder({
        category: CouponCategory.AMOUNT_OFF_ORDERS,
      }),
    ).toBe(true);
    expect(
      couponRequiresMinimumOrder({ type: CouponType.FREE_DELIVERY }),
    ).toBe(true);
    expect(
      couponRequiresMinimumOrder({
        category: CouponCategory.AMOUNT_OFF_ITEMS,
      }),
    ).toBe(false);
  });

  it('calculates eligible subtotal for item-specific coupons', () => {
    const eligible = resolveEligibleSubtotal(
      {
        category: CouponCategory.AMOUNT_OFF_ITEMS,
        applicableItems: ['product-a'],
      },
      cartItems,
      businessId,
    );

    expect(eligible).toBe(2000);
  });

  it('computes fixed and percentage discounts from eligible subtotal', () => {
    expect(
      computeDiscountAmount(
        { type: CouponType.FIXED_AMOUNT, discount: 500 },
        2000,
      ),
    ).toBe(500);
    expect(
      computeDiscountAmount(
        { type: CouponType.FIXED_AMOUNT, discount: 2500 },
        2000,
      ),
    ).toBe(2000);
    expect(
      computeDiscountAmount({ type: CouponType.PERCENTAGE, discount: 10 }, 2000),
    ).toBe(200);
  });

  it('rejects coupons when minimum order is not met', () => {
    expect(() =>
      assertMinimumOrderAmount({ minimumOrderAmount: 5000 }, 2500),
    ).toThrow('Order subtotal must be at least 5000');
  });

  it('rejects scoped coupons with no eligible cart lines', () => {
    expect(() =>
      assertCouponCanBeApplied(
        {
          category: CouponCategory.AMOUNT_OFF_ITEMS,
          type: CouponType.FIXED_AMOUNT,
          applicableItems: ['missing-product'],
          isActive: true,
        },
        { orderCount: 0, cartSubtotal: 2500 },
      ),
    ).not.toThrow();

    const eligible = resolveEligibleSubtotal(
      {
        category: CouponCategory.AMOUNT_OFF_ITEMS,
        applicableItems: ['missing-product'],
      },
      cartItems,
      businessId,
    );
    expect(eligible).toBe(0);
  });
});
