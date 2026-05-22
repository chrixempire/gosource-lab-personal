import { calculateTotalPrice } from './helpers';

describe('calculateTotalPrice', () => {
  it('does not throw when unit JSON is invalid', () => {
    const total = calculateTotalPrice(
      [
        {
          quantity: 2,
          unit: 'kilogram',
          cartProduct: {
            version: 'v2',
            unit: 'not-json',
            discountPrice: 1000,
          },
        },
      ],
      '651ec7953d94128bc73a448a',
    );

    expect(total).toBe(2000);
  });

  it('skips cart lines without a product snapshot', () => {
    const total = calculateTotalPrice(
      [
        {
          quantity: 1,
          unit: 'pieces',
          product: null,
        },
        {
          quantity: 1,
          unit: 'pieces',
          cartProduct: {
            version: 'v1',
            discountPrice: 500,
            specialPrices: [],
          },
        },
      ],
      '651ec7953d94128bc73a448a',
    );

    expect(total).toBe(500);
  });
});
