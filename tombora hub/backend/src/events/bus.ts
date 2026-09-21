import { EventEmitter } from 'events';
import { logger } from '../shared/logger';

export type DomainEventMap = {
  OrderCreated: { orderId: string };
  PaymentCompleted: { paymentId: string; orderId: string };
  PaymentFailed: { paymentId: string; orderId: string };
  OrderDelivered: { orderId: string };
  OrderCancelled: { orderId: string };
  ProductCreated: { productId: string };
  ProductApproved: { productId: string };
  InventoryLow: { variantId: string; quantity: number };
  ReturnRequested: { returnId: string };
  RefundCompleted: { refundId: string };
  PayoutCompleted: { payoutId: string };
  SellerVerified: { sellerId: string };
};

class DomainEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  on<K extends keyof DomainEventMap>(event: K, handler: (payload: DomainEventMap[K]) => void) {
    this.emitter.on(event, (payload) => {
      try {
        handler(payload);
      } catch (err) {
        logger.error({ err, event }, 'Domain event handler failed');
      }
    });
  }

  emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K]) {
    logger.debug({ event, payload }, 'Domain event');
    this.emitter.emit(event, payload);
  }
}

export const domainEvents = new DomainEventBus();
