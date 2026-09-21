import type { Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { AppError, Errors } from '../shared/errors';
import { env } from '../config/env';
import { clawbackRefund } from './finance.service';
import { assertOrderTransition } from './order-state';

type Tx = Prisma.TransactionClient;

export async function requestReturn(
  userId: string,
  orderId: string,
  reason: string,
  notes: string | undefined,
  items: Array<{ orderItemId: string; quantity: number }>,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      sellerOrders: { include: { items: true } },
      returns: true,
    },
  });
  if (!order) throw Errors.notFound('Order');
  if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
    throw Errors.conflict('Returns are only allowed after delivery');
  }

  const windowSetting = await prisma.setting.findUnique({ where: { key: 'return_window_days' } });
  const windowDays =
    typeof windowSetting?.value === 'number'
      ? windowSetting.value
      : env.RETURN_WINDOW_DAYS;

  const anchor = order.completedAt || order.paidAt || order.updatedAt;
  const ms = windowDays * 24 * 60 * 60 * 1000;
  if (Date.now() - anchor.getTime() > ms) {
    throw new AppError(
      'RETURN_WINDOW_EXPIRED',
      'The return window for this order has expired',
      409,
    );
  }

  const allItems = order.sellerOrders.flatMap((s) => s.items);
  for (const line of items) {
    const found = allItems.find((i) => i.id === line.orderItemId);
    if (!found) throw Errors.notFound('Order item');
    if (line.quantity < 1 || line.quantity > found.quantity) {
      throw Errors.validation('Invalid return quantity');
    }
  }

  return prisma.$transaction(async (tx) => {
    if (canTransitionSafe(order.status, 'RETURN_REQUESTED')) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'RETURN_REQUESTED' },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: 'RETURN_REQUESTED',
          actorId: userId,
          reason,
        },
      });
    }

    const ret = await tx.returnRequest.create({
      data: {
        orderId,
        customerId: userId,
        reason: reason as never,
        notes,
        status: 'REQUESTED',
        items: {
          create: items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return ret;
  });
}

function canTransitionSafe(from: string, to: string) {
  try {
    assertOrderTransition(from as never, to as never);
    return true;
  } catch {
    return false;
  }
}

export async function reviewReturn(
  returnId: string,
  action: 'APPROVE' | 'REJECT',
  notes?: string,
) {
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { items: true, order: { include: { payments: true } } },
  });
  if (!ret) throw Errors.notFound('Return');
  if (!['REQUESTED', 'UNDER_REVIEW'].includes(ret.status)) {
    throw Errors.conflict('Return cannot be reviewed in current status');
  }

  if (action === 'REJECT') {
    return prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'REJECTED', notes: notes || ret.notes },
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: 'APPROVED', notes: notes || ret.notes },
    });

    // Fast-path demo: inspect + refund immediately
    await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: 'REFUND_PENDING' },
    });

    let refundGross = 0n;
    for (const item of ret.items) {
      const claw = await clawbackRefund(tx, item.orderItemId, item.quantity);
      refundGross += claw.refundGross;
    }

    const payment = ret.order.payments.find((p) => p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED');
    if (!payment) throw Errors.conflict('No paid payment to refund');

    const refund = await tx.refund.create({
      data: {
        returnId: ret.id,
        paymentId: payment.id,
        amount: refundGross,
        currency: env.DEFAULT_CURRENCY,
        status: 'REFUNDED',
        providerRef: `REF-${ret.id.slice(0, 8)}`,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: refundGross >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    });

    if (canTransitionSafe(ret.order.status, 'REFUND_PENDING')) {
      await tx.order.update({ where: { id: ret.orderId }, data: { status: 'REFUND_PENDING' } });
    }
    if (canTransitionSafe('REFUND_PENDING', 'REFUNDED') || ret.order.status === 'REFUND_PENDING') {
      await tx.order.update({ where: { id: ret.orderId }, data: { status: 'REFUNDED' } });
    }

    await tx.returnRequest.update({
      where: { id: returnId },
      data: { status: 'CLOSED' },
    });

    return {
      returnId: ret.id,
      refund: { ...refund, amount: String(refund.amount) },
    };
  });
}

export async function listReturns(userId?: string, asAdmin = false) {
  const items = await prisma.returnRequest.findMany({
    where: asAdmin ? undefined : { customerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      items: true,
      order: {
        select: {
          orderNumber: true,
          status: true,
          customer: { select: { fullName: true, email: true } },
        },
      },
      refunds: true,
    },
  });

  return items.map((r) => ({
    ...r,
    refunds: r.refunds.map((f) => ({ ...f, amount: String(f.amount) })),
  }));
}

export async function listSellerReturns(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!seller) throw Errors.notFound('Seller profile');

  const items = await prisma.returnRequest.findMany({
    where: {
      order: { sellerOrders: { some: { sellerId: seller.id } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      items: true,
      order: {
        select: {
          orderNumber: true,
          status: true,
          customer: { select: { fullName: true, email: true } },
        },
      },
      refunds: true,
    },
  });

  return items.map((r) => ({
    ...r,
    refunds: r.refunds.map((f) => ({ ...f, amount: String(f.amount) })),
  }));
}

// keep Tx type used for future extensions
void (null as unknown as Tx);
