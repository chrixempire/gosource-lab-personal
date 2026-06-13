import { buildLowStockPatch, computeIsLowStock } from './low-stock.util';

describe('low-stock.util', () => {
  it('returns true when quantity is at or below the threshold', () => {
    expect(
      computeIsLowStock({
        trackQuantity: true,
        quantity: 10,
        lowStockLevel: 10,
      }),
    ).toBe(true);

    expect(
      computeIsLowStock({
        trackQuantity: true,
        quantity: 5,
        lowStockLevel: 10,
      }),
    ).toBe(true);
  });

  it('returns false when quantity is above the threshold', () => {
    expect(
      computeIsLowStock({
        trackQuantity: true,
        quantity: 100010,
        lowStockLevel: 10,
        isLowStock: true,
      }),
    ).toBe(false);
  });

  it('returns a patch when the stored flag is stale', () => {
    expect(
      buildLowStockPatch({
        trackQuantity: true,
        quantity: 100010,
        lowStockLevel: 10,
        isLowStock: true,
      }),
    ).toEqual({ isLowStock: false });
  });
});
