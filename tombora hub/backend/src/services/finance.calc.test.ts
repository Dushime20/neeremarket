import { describe, expect, it } from 'vitest';
import { calculateCommissionAmount } from './commission.engine';

describe('Finance calculations', () => {
  it('seller net after 10% commission on 12000 is 10800', () => {
    const gross = 12000n;
    const commission = calculateCommissionAmount(gross, 1000);
    expect(commission).toBe(1200n);
    expect(gross - commission).toBe(10800n);
  });
});
