import { describe, expect, it } from 'vitest';
import { canTransition } from './order-state';

describe('Order state machine', () => {
  it('allows PENDING_PAYMENT to PAID', () => {
    expect(canTransition('PENDING_PAYMENT', 'PAID')).toBe(true);
  });

  it('blocks DELIVERED to PENDING_PAYMENT', () => {
    expect(canTransition('DELIVERED', 'PENDING_PAYMENT')).toBe(false);
  });

  it('allows PAID to CONFIRMED', () => {
    expect(canTransition('PAID', 'CONFIRMED')).toBe(true);
  });
});
