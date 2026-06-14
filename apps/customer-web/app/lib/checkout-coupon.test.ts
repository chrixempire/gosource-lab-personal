import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkoutCouponDisplayLabel,
  formatCheckoutCouponLabel,
  hasCheckoutCouponApplied,
  normalizeRequestCouponCode,
  resolveCheckoutCouponLabel,
} from './checkout-coupon.ts';

test('formatCheckoutCouponLabel formats fixed amount coupons', () => {
  assert.equal(
    formatCheckoutCouponLabel({
      code: 'SAVE500',
      type: 'FIXED_AMOUNT',
      discount: 500,
    }),
    'SAVE500 · -₦500',
  );
});

test('formatCheckoutCouponLabel formats percentage and free delivery coupons', () => {
  assert.equal(
    formatCheckoutCouponLabel({
      code: 'TENOFF',
      type: 'PERCENTAGE',
      discount: 10,
    }),
    'TENOFF · -10%',
  );
  assert.equal(
    formatCheckoutCouponLabel({
      code: 'FREESHIP',
      type: 'FREE_DELIVERY',
      discount: 100,
    }),
    'FREESHIP · Free delivery',
  );
});

test('hasCheckoutCouponApplied detects applied coupons', () => {
  assert.equal(hasCheckoutCouponApplied({ coupon: true }), true);
  assert.equal(hasCheckoutCouponApplied({ couponCode: 'SAVE500' }), true);
  assert.equal(
    hasCheckoutCouponApplied({
      couponDetails: { code: 'SAVE500', type: 'FIXED_AMOUNT', discount: 500 },
    }),
    true,
  );
  assert.equal(hasCheckoutCouponApplied({}), false);
  assert.equal(hasCheckoutCouponApplied({ coupon: false, couponCode: 'false' }), false);
});

test('normalizeRequestCouponCode rejects legacy falsey string values', () => {
  assert.equal(normalizeRequestCouponCode('false'), null);
  assert.equal(normalizeRequestCouponCode(false), null);
  assert.equal(normalizeRequestCouponCode(' SAVE10 '), 'SAVE10');
});

test('resolveCheckoutCouponLabel ignores invalid legacy coupon codes', () => {
  assert.equal(
    resolveCheckoutCouponLabel({
      coupon: false,
      couponCode: 'false',
      couponDetails: null,
    }),
    null,
  );
});

test('checkoutCouponDisplayLabel never renders boolean false', () => {
  assert.equal(checkoutCouponDisplayLabel(null, false), 'Apply coupon code');
  assert.equal(checkoutCouponDisplayLabel(undefined, true), 'Coupon applied');
  assert.equal(checkoutCouponDisplayLabel('SAVE10 · -₦500', true), 'SAVE10 · -₦500');
});
