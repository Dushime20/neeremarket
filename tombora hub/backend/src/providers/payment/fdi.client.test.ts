import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    FDI_BASE_URL: '',
    FDI_APP_ID: '',
    FDI_APP_SECRET: '',
    FDI_COLLECTION_ACCOUNT_ID: '',
    FDI_PAYOUT_ACCOUNT_ID: '',
    FDI_DEFAULT_CHANNEL: 'momo-mtn-rw',
    FDI_CALLBACK_BASE_URL: '',
    API_PREFIX: '/api/v1',
  },
}));

const { buildTrxRef, fdiGetTransaction, fdiMomoPull, fdiMomoPush, trxKind } = await import('./fdi.client');

describe('FDI trxRef routing', () => {
  it('tags each transfer kind so the shared webhook can route it', () => {
    const id = '3f2a9c1e-7b4d-4e11-9a0b-2c8d6e5f1a3b';
    expect(trxKind(buildTrxRef('order', id))).toBe('order');
    expect(trxKind(buildTrxRef('payout', id))).toBe('payout');
    expect(trxKind(buildTrxRef('refund', id))).toBe('refund');
  });

  it('treats unknown references as order collections', () => {
    expect(trxKind('nm_abc_123456')).toBe('order');
    expect(trxKind('something-else')).toBe('order');
  });
});

describe('FDI without credentials', () => {
  it('refuses to simulate collections, transfers or status checks', async () => {
    const input = { trxRef: 'nm_x_1', msisdn: '0781234567', amount: 1000 };
    await expect(fdiMomoPull(input)).rejects.toThrow(/not configured/);
    await expect(fdiMomoPush(input)).rejects.toThrow(/not configured/);
    await expect(fdiGetTransaction('nm_x_1')).rejects.toThrow(/not configured/);
  });
});
