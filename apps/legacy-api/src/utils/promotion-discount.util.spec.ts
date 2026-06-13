import {
  areUnitPriceMapsEqual,
  buildPromotionDiscountPatch,
  computeDiscountedUnitMap,
  computePercentageDiscountPrice,
  isPromotionDiscountStale,
} from './promotion-discount.util';

describe('promotion-discount.util', () => {
  const promotion = {
    isPercentageDiscounted: true,
    discountValue: 10,
  };

  it('computes v2 discounted units from unit prices', () => {
    expect(
      computeDiscountedUnitMap('{"pieces":1000,"crate":5000}', 10),
    ).toEqual({
      pieces: 900,
      crate: 4500,
    });
  });

  it('computes v1 percentage discount price', () => {
    expect(computePercentageDiscountPrice(1000, 10)).toBe(900);
  });

  it('detects stale discountedUnit maps', () => {
    const product = {
      version: 'v2',
      unit: '{"pieces":1000}',
      discountedUnit: '{"pieces":900}',
      promotion,
    };

    expect(isPromotionDiscountStale(product)).toBe(false);

    expect(
      isPromotionDiscountStale({
        ...product,
        discountedUnit: '{"pieces":800}',
      }),
    ).toBe(true);

    expect(
      isPromotionDiscountStale({
        ...product,
        discountedUnit: '{"crate":4500}',
      }),
    ).toBe(true);
  });

  it('returns a patch only when stale', () => {
    const staleProduct = {
      version: 'v2',
      unit: '{"pieces":10.8}',
      discountedUnit: '{"pieces":9}',
      promotion,
    };

    expect(buildPromotionDiscountPatch(staleProduct)).toEqual({
      discountedUnit: JSON.stringify({ pieces: 9.72 }),
    });
  });

  it('compares unit maps with matching keys and prices', () => {
    expect(
      areUnitPriceMapsEqual({ pieces: 900 }, { pieces: 900 }),
    ).toBe(true);
    expect(
      areUnitPriceMapsEqual({ pieces: 900 }, { pieces: 899.999 }),
    ).toBe(true);
    expect(
      areUnitPriceMapsEqual({ pieces: 900 }, { crate: 900 }),
    ).toBe(false);
  });
});
