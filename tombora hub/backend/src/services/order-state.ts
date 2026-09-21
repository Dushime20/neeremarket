import type { OrderStatus } from '@prisma/client';
import { Errors } from '../shared/errors';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['CONFIRMED', 'CANCELLED', 'REFUND_PENDING'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  PROCESSING: ['READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  READY_FOR_SHIPMENT: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'RETURN_REQUESTED', 'REFUND_PENDING'],
  COMPLETED: ['RETURN_REQUESTED'],
  CANCELLED: [],
  RETURN_REQUESTED: ['RETURNED', 'REFUND_PENDING', 'CANCELLED'],
  RETURNED: ['REFUND_PENDING', 'COMPLETED'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
  DISPUTED: ['PROCESSING', 'REFUND_PENDING', 'CANCELLED', 'COMPLETED'],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw Errors.invalidTransition(from, to);
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return (TRANSITIONS[from] || []).includes(to);
}
