import { describe, expect, it } from 'vitest';
import { calculateCommissionAmount } from './commission.engine';

describe('Commission Engine', () => {
  it('calculates 10% of 50000 RWF as 5000', () => {
    expect(calculateCommissionAmount(50000n, 1000)).toBe(5000n);
  });

  it('supports fixed + percentage', () => {
    expect(calculateCommissionAmount(50000n, 1000, 500n)).toBe(5500n);
  });
});
