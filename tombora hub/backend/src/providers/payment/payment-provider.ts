import { FdiPaymentProvider } from './fdi.provider';

export type PaymentCreateInput = {
  amount: number;
  currency: string;
  orderId: string;
  customerPhone?: string;
  idempotencyKey: string;
  method: 'MTN_MOMO' | 'AIRTEL_MONEY';
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

export function getPaymentProvider(): PaymentProvider {
  return new FdiPaymentProvider();
}
