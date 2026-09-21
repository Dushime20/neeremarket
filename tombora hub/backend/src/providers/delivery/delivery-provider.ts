export type DeliveryQuoteInput = {
  method: string;
  province?: string;
  district?: string;
  weightGrams?: number;
};

export type DeliveryQuoteResult = {
  fee: number;
  currency: string;
  etaDays?: number;
};

export interface DeliveryProvider {
  readonly code: string;
  quote(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult>;
}

export class SellerDeliveryProvider implements DeliveryProvider {
  readonly code = 'seller';

  async quote(_input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    return { fee: 0, currency: 'RWF', etaDays: 2 };
  }
}

export function getDeliveryProvider(code: string): DeliveryProvider {
  switch (code) {
    case 'seller':
    default:
      return new SellerDeliveryProvider();
  }
}
