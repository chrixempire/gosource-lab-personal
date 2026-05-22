import { calculateDeliveryFee } from '../helpers';

describe('calculateDeliveryFee', () => {
  const TIER_1_THRESHOLD = 1000000;
  const TIER_1_BASE = 18000;
  const TIER_1_PERCENTAGE = 0.02;

  it('should use default values when no config is provided (below threshold)', () => {
    const total = 500000;
    const expected = TIER_1_BASE + total * TIER_1_PERCENTAGE; // 18000 + 10000 = 28000
    expect(calculateDeliveryFee(total)).toBe(expected);
  });

  it('should use dynamic config when provided (below threshold)', () => {
    const total = 500000;
    const config = {
      threshold: 1000000,
      baseFee: 10000,
      percentage: 0.05,
    };
    const expected = 10000 + total * 0.05; // 10000 + 25000 = 35000
    expect(calculateDeliveryFee(total, config)).toBe(expected);
  });

  it('should handle threshold correctly with config', () => {
    const total = 2000000; // Above default and custom threshold
    const config = {
      threshold: 1500000,
      baseFee: 10000,
      percentage: 0.05,
    };
    // For now, TIER 2 logic still uses defaults in helpers.ts
    const TIER_2_BASE = 33000;
    const TIER_2_PERCENTAGE = 0.01;
    const expected = TIER_2_BASE + total * TIER_2_PERCENTAGE; // 33000 + 20000 = 53000
    expect(calculateDeliveryFee(total, config)).toBe(expected);
  });
});
