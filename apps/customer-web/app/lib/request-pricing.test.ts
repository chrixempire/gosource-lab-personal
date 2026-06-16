import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isFreeDeliveryCoupon,
  resolveBillableDiscount,
  resolveRequestTotalPrice,
} from './request-pricing.ts';

test('free delivery coupons waive delivery without subtracting discount again', () => {
  assert.equal(
    isFreeDeliveryCoupon({ code: 'FREESHIP', type: 'FREE_DELIVERY', discount: 0 }),
    true,
  );

  const request = {
    discount: 19_000,
    couponDetails: {
      code: '3Z3FT2',
      type: 'FREE_DELIVERY' as const,
      discount: 0,
    },
  };

  assert.equal(resolveBillableDiscount(request), 0);
  assert.equal(
    resolveRequestTotalPrice({
      subtotal: 50_000,
      deliveryFee: 0,
      serviceCharge: 0,
      discount: request.discount,
      couponDetails: request.couponDetails,
    }),
    50_000,
  );
});

test('fixed amount coupons still reduce the payable total', () => {
  const request = {
    discount: 500,
    couponDetails: {
      code: 'SAVE500',
      type: 'FIXED_AMOUNT' as const,
      discount: 500,
    },
  };

  assert.equal(resolveBillableDiscount(request), 500);
  assert.equal(
    resolveRequestTotalPrice({
      subtotal: 50_000,
      deliveryFee: 19_000,
      serviceCharge: 0,
      discount: request.discount,
      couponDetails: request.couponDetails,
    }),
    68_500,
  );
});
