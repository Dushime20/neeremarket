import { FdiPaymentProvider } from './fdi.provider';

export type PaymentCreateInput = {
  amount: number;
  currency: string;
  orderId: string;
  customerPhone?: string;
  idempotencyKey: string;
  method: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'MOCK';
};

export type PaymentCreateResult = {
  providerRef: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  raw?: unknown;
};

export type PaymentWebhookResult = {
  providerRef: string;
  status: 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING';
  amount?: number;
};

export interface PaymentProvider {
  readonly code: string;
  createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult>;
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): Promise<PaymentWebhookResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly code = 'mock';

  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    return {
      providerRef: `MOCK-${input.idempotencyKey}`,
      status: 'PENDING',
      raw: {
        simulated: true,
        instructions: {
          title: 'Demo payment',
          message: 'Use the confirm button to simulate a successful Mobile Money payment.',
          network: 'Demo',
          phone: input.customerPhone || '',
        },
      },
    };
  }

  async verifyWebhook(
    _headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): Promise<PaymentWebhookResult> {
    const payload = body as { providerRef?: string; status?: string; amount?: number };
    return {
      providerRef: payload.providerRef || 'UNKNOWN',
      status: (payload.status as PaymentWebhookResult['status']) || 'PAID',
      amount: payload.amount,
    };
  }
}

export function getPaymentProvider(code: string): PaymentProvider {
  switch ((code || '').toLowerCase()) {
    case 'fdi':
      return new FdiPaymentProvider();
    case 'mock':
      return new MockPaymentProvider();
    default:
      return new FdiPaymentProvider();
  }
}
