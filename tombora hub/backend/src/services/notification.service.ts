import type { NotificationChannel } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { domainEvents } from '../events/bus';
import { logger } from '../shared/logger';

export async function notifyUser(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: NotificationChannel;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: (input.data || undefined) as object | undefined,
      channel: input.channel || 'IN_APP',
    },
  });
}

export async function listNotifications(userId: string, unreadOnly = false) {
  const items = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  });
  return { items, unreadCount };
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return listNotifications(userId);
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return listNotifications(userId);
}

export function registerNotificationListeners() {
  domainEvents.on('PaymentCompleted', async ({ orderId }) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          sellerOrders: { include: { seller: { include: { user: true } } } },
        },
      });
      if (!order) return;

      await notifyUser({
        userId: order.customerId,
        type: 'PAYMENT_COMPLETED',
        title: 'Payment successful',
        body: `Your payment for ${order.orderNumber} was confirmed.`,
        data: { orderId },
      });

      for (const so of order.sellerOrders) {
        await notifyUser({
          userId: so.seller.userId,
          type: 'NEW_ORDER',
          title: 'New order',
          body: `You received ${so.sellerOrderNumber}.`,
          data: { orderId, sellerOrderId: so.id },
        });
      }
    } catch (err) {
      logger.error({ err }, 'PaymentCompleted notification failed');
    }
  });

  domainEvents.on('OrderDelivered', async ({ orderId }) => {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return;
      await notifyUser({
        userId: order.customerId,
        type: 'ORDER_DELIVERED',
        title: 'Order delivered',
        body: `${order.orderNumber} has been delivered.`,
        data: { orderId },
      });
    } catch (err) {
      logger.error({ err }, 'OrderDelivered notification failed');
    }
  });

  domainEvents.on('SellerOrderShipped', async ({ sellerOrderId }) => {
    try {
      const so = await prisma.sellerOrder.findUnique({
        where: { id: sellerOrderId },
        include: { order: true, seller: true },
      });
      if (!so) return;
      await notifyUser({
        userId: so.order.customerId,
        type: 'ORDER_SHIPPED',
        title: 'Your parcel is on the way',
        body: `${so.seller.businessName} shipped ${so.sellerOrderNumber}. Confirm delivery in your order once it arrives.`,
        data: { orderId: so.orderId, sellerOrderId },
      });
    } catch (err) {
      logger.error({ err }, 'SellerOrderShipped notification failed');
    }
  });

  domainEvents.on('SellerOrderDelivered', async ({ sellerOrderId }) => {
    try {
      const so = await prisma.sellerOrder.findUnique({
        where: { id: sellerOrderId },
        include: { seller: true },
      });
      if (!so) return;
      await notifyUser({
        userId: so.seller.userId,
        type: 'FUNDS_AVAILABLE',
        title: 'Delivery confirmed — funds available',
        body: `${so.sellerOrderNumber} was delivered. ${so.sellerEarnings} RWF is now available to withdraw.`,
        data: { orderId: so.orderId, sellerOrderId },
      });
    } catch (err) {
      logger.error({ err }, 'SellerOrderDelivered notification failed');
    }
  });

  domainEvents.on('PayoutCompleted', async ({ payoutId }) => {
    try {
      const payout = await prisma.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { seller: true },
      });
      if (!payout) return;
      await notifyUser({
        userId: payout.seller.userId,
        type: 'PAYOUT_PROCESSED',
        title: 'Payout sent',
        body: `${payout.amount} ${payout.currency} was sent to your Mobile Money wallet.`,
        data: { payoutId },
      });
    } catch (err) {
      logger.error({ err }, 'PayoutCompleted notification failed');
    }
  });

  domainEvents.on('PayoutFailed', async ({ payoutId, reason }) => {
    try {
      const payout = await prisma.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { seller: true },
      });
      if (!payout) return;
      await notifyUser({
        userId: payout.seller.userId,
        type: 'PAYOUT_FAILED',
        title: 'Payout failed',
        body: `Your ${payout.amount} ${payout.currency} withdrawal failed${reason ? `: ${reason}` : ''}. The funds are back in your available balance.`,
        data: { payoutId },
      });
    } catch (err) {
      logger.error({ err }, 'PayoutFailed notification failed');
    }
  });

  domainEvents.on('RefundCompleted', async ({ refundId }) => {
    try {
      const refund = await prisma.refund.findUnique({
        where: { id: refundId },
        include: { payment: { include: { order: true } } },
      });
      if (!refund) return;
      await notifyUser({
        userId: refund.payment.order.customerId,
        type: 'REFUND_COMPLETED',
        title: 'Refund sent',
        body: `${refund.amount} ${refund.currency} for ${refund.payment.order.orderNumber} was refunded to your Mobile Money wallet.`,
        data: { orderId: refund.payment.orderId },
      });
    } catch (err) {
      logger.error({ err }, 'RefundCompleted notification failed');
    }
  });

  logger.info('Notification domain listeners registered');
}
