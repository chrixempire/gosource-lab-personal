import {
  resolvePurchaseUnitConversion,
  snapshotOrderFinancialLines,
  summarizeOrderFinancials,
} from './order-financials';

describe('order financials', () => {
  it('uses one base unit when the selected and tracked units match', () => {
    expect(
      resolvePurchaseUnitConversion(
        {
          purchaseUnit: 'kilogram',
          newUnit: '[{"unit":"kilogram","quantity":1}]',
        },
        'kilogram',
      ),
    ).toBe(1);
  });

  it('converts a bulk selling unit into the base units it contains', () => {
    // Stock/cost is per zebra cross (₦8,000). One oplo contains 8 zebra crosses.
    expect(
      resolvePurchaseUnitConversion(
        {
          purchaseUnit: 'zebra cross',
          newUnit:
            '[{"unit":"oplo","quantity":8},{"unit":"zebra cross","quantity":1}]',
        },
        'oplo',
      ),
    ).toBe(8);
  });

  it('snapshots selling revenue and the converted inventory cost of a bulk unit', () => {
    const [line] = snapshotOrderFinancialLines([
      {
        quantity: 1,
        unit: 'oplo',
        cartProduct: {
          version: 'v2',
          purchaseUnit: 'zebra cross',
          unit: JSON.stringify({ oplo: 68000 }),
          newUnit: JSON.stringify([
            { unit: 'oplo', quantity: 8, price: 68000 },
            { unit: 'zebra cross', quantity: 1, price: 8500 },
          ]),
          marketPrice: 8000,
        },
      },
    ]);

    expect(line).toMatchObject({
      unitSellingPrice: 68000,
      grossLineRevenue: 68000,
      baseUnitCost: 8000,
      baseQuantityPerSellingUnit: 8,
      totalBaseQuantity: 8,
      totalCost: 64000,
      grossProfit: 4000,
    });
  });

  it('snapshots the live inventory cost used at approval, not an older cart cost', () => {
    const [line] = snapshotOrderFinancialLines([
      {
        quantity: 1,
        unit: 'piece',
        cartProduct: { version: 'v2', unit: '{"piece":1500}', marketPrice: 400 },
        product: { marketPrice: 500, purchaseUnit: 'piece' },
      },
    ]);

    expect(line.unitSellingPrice).toBe(1500);
    expect(line.baseUnitCost).toBe(500);
    expect(line.totalCost).toBe(500);
  });

  it('calculates historical revenue from the charged total without fees', () => {
    // Mirrors a real order: ₦76,000 charged, ₦8,000 delivery, one oplo (₦68,000)
    // costing 8 × ₦8,000 = ₦64,000 → ₦4,000 profit.
    const result = summarizeOrderFinancials({
      totalPrice: 76000,
      deliveryFee: 8000,
      serviceCharge: 0,
      products: [
        {
          quantity: 1,
          unit: 'oplo',
          cartProduct: {
            marketPrice: 8000,
            purchaseUnit: 'zebra cross',
            newUnit: JSON.stringify([
              { unit: 'oplo', quantity: 8 },
              { unit: 'zebra cross', quantity: 1 },
            ]),
          },
        },
      ],
    });

    expect(result).toEqual({
      revenue: 68000,
      costOfGoodsSold: 64000,
      grossProfit: 4000,
      verified: true,
      unresolvedLines: [],
    });
  });

  it('costs an untracked product 1:1 against its market price', () => {
    // TRACK QUANTITY = No, single selling unit, no Q/U: marketPrice is the cost
    // of one sold unit. 5 × oyam tutu @ ₦10,000 = ₦50,000, cost ₦6,000 each.
    const result = summarizeOrderFinancials({
      totalPrice: 50000,
      products: [
        {
          quantity: 5,
          unit: 'oyam tutu',
          cartProduct: {
            trackQuantity: false,
            marketPrice: 6000,
            unit: JSON.stringify({ 'oyam tutu': 10000 }),
            newUnit: JSON.stringify([{ unit: 'oyam tutu', price: 10000 }]),
          },
        },
      ],
    });

    expect(result).toEqual({
      revenue: 50000,
      costOfGoodsSold: 30000,
      grossProfit: 20000,
      verified: true,
      unresolvedLines: [],
    });
  });

  it('does not report profit when an older line has no historical cost', () => {
    const result = summarizeOrderFinancials({
      totalPrice: 10000,
      products: [{ quantity: 1, unit: 'piece', cartProduct: {} }],
    });

    expect(result.revenue).toBe(10000);
    expect(result.grossProfit).toBe(0);
    expect(result.verified).toBe(false);
  });

  it('does not guess a conversion when historical selling and purchase units differ', () => {
    const result = summarizeOrderFinancials({
      totalPrice: 15000,
      products: [
        {
          quantity: 1,
          unit: 'carton',
          cartProduct: {
            marketPrice: 500,
            purchaseUnit: 'piece',
            newUnit: JSON.stringify([{ unit: 'pack', quantity: 5 }]),
          },
        },
      ],
    });

    expect(result.verified).toBe(false);
    expect(result.grossProfit).toBe(0);
  });

  it('uses immutable snapshots even when the embedded product price changes', () => {
    const result = summarizeOrderFinancials({
      totalPrice: 15000,
      products: [
        {
          quantity: 1,
          financialSnapshotVersion: 3,
          totalCost: 9000,
          cartProduct: { marketPrice: 999999 },
        },
      ],
    });

    expect(result.costOfGoodsSold).toBe(9000);
    expect(result.grossProfit).toBe(6000);
    expect(result.verified).toBe(true);
  });

  it('sums revenue from the frozen line snapshots, ignoring a stale totalPrice', () => {
    // Real prod case: an item was added to the order after checkout, so the
    // stored totalPrice (₦70,800) lags the actual line items (net ₦77,799).
    // Revenue must follow the frozen per-line snapshots, not the drifted total.
    const result = summarizeOrderFinancials({
      totalPrice: 70800, // stale — not recomputed when the last line was added
      deliveryFee: 0,
      serviceCharge: 0,
      additionalTotalPrice: 0,
      products: [
        { financialSnapshotVersion: 3, netLineRevenue: 70799, totalCost: 60000 },
        { financialSnapshotVersion: 3, netLineRevenue: 7000, totalCost: 6750 },
      ],
    });

    expect(result.revenue).toBe(77799);
    expect(result.costOfGoodsSold).toBe(66750);
    expect(result.grossProfit).toBe(11049);
    expect(result.verified).toBe(true);
  });

  it('lists the offending line(s) that block an order from the profit calc', () => {
    // Lemon Grass has no resolvable cost (no market price / no unit conversion),
    // so the whole order is unverified. The dashboard needs to name that line.
    const result = summarizeOrderFinancials({
      totalPrice: 20000,
      products: [
        {
          quantity: 3,
          unit: 'bunch',
          cartProduct: {
            name: 'Lemon Grass',
            version: 'v2',
            unit: JSON.stringify({ bunch: 1500 }), // sells for ₦1,500 …
            purchaseUnit: 'kilogram', // … but no marketPrice / no bunch conversion
            newUnit: JSON.stringify([{ unit: 'kilogram', quantity: 1 }]),
          },
        },
      ],
    });

    expect(result.verified).toBe(false);
    expect(result.unresolvedLines).toEqual([
      {
        productName: 'Lemon Grass',
        unit: 'bunch',
        quantity: 3,
        marketPrice: null, // the reason it's excluded
        sellingPrice: 1500, // still known, so we can show it
      },
    ]);
  });
});
