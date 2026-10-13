import {
  buildTrxRef,
  fdiGetTransaction,
  fdiMomoPull,
  inferChannel,
  parseFdiWebhook,
} from './fdi.client';
import type {
  PaymentCreateInput,
  PaymentCreateResult,
  PaymentProvider,
  PaymentWebhookResult,
} from './payment-provider';

export class FdiPaymentProvider implements PaymentProvider {
  readonly code = 'fdi';

  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    const phone = input.customerPhone;
    if (!phone) {
      throw new Error('A Mobile Money phone number is required to place this order');
    }

    const pull = await fdiMomoPull({
      trxRef: buildTrxRef('order', input.orderId),
      msisdn: phone,
      amount: input.amount,
      method: input.method,
    });

    const channel = pull.channelId || inferChannel(phone, input.method);
    const network = channel.includes('airtel') ? 'Airtel Money' : 'MTN MoMo';

    return {
      providerRef: pull.trxRef,
      status: 'PENDING',
      raw: {
        gwRef: pull.gwRef,
        channelId: channel,
        msisdn: pull.msisdn,
        state: pull.state,
        instructions: {
          title: `Approve on ${network}`,
          message: `A ${network} prompt was sent to ${pull.msisdn}. Enter your PIN to complete payment.`,
          network,
          phone: pull.msisdn,
        },
      },
    };
  }

  async verifyWebhook(
    _headers: Record<string, string | string[] | undefined>,
    body: unknown,
  ): Promise<PaymentWebhookResult> {
    const parsed = parseFdiWebhook(body);
    if (!parsed.providerRef) {
      return { providerRef: 'UNKNOWN', status: 'PENDING' };
    }

    const live = await fdiGetTransaction(parsed.providerRef);
    if (live.status === 'SUCCESSFUL') {
      return {
        providerRef: parsed.providerRef,
        status: 'PAID',
        amount: live.details?.amount != null ? Number(live.details.amount) : undefined,
      };
    }
    if (live.status === 'FAILED') {
      return { providerRef: parsed.providerRef, status: 'FAILED' };
    }
    return { providerRef: parsed.providerRef, status: 'PENDING' };
  }
}
