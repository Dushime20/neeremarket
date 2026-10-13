import type { Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { AppError, Errors } from '../shared/errors';
import { env } from '../config/env';
import { clawbackRefund } from './finance.service';
import { assertOrderTransition } from './order-state';
import { domainEvents } from '../events/bus';
import { buildTrxRef, fdiGetTransaction, fdiMomoPush } from '../providers/payment/fdi.client';

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

  const payment = ret.order.payments.find((p) => p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED');
  if (!payment) throw Errors.conflict('No paid payment to refund');

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.returnRequest.updateMany({
      where: { id: returnId, status: { in: ['REQUESTED', 'UNDER_REVIEW'] } },
      data: { status: 'REFUND_PENDING', notes: notes || ret.notes },
    });
    if (claimed.count === 0) throw Errors.conflict('Return cannot be reviewed in current status');

    let refundGross = 0n;
    for (const item of ret.items) {
      const claw = await clawbackRefund(tx, item.orderItemId, item.quantity);
      refundGross += claw.refundGross;
    }

    await tx.refund.create({
      data: {
        returnId: ret.id,
        paymentId: payment.id,
        amount: refundGross,
        currency: env.DEFAULT_CURRENCY,
        status: 'INITIATED',
        providerRef: buildTrxRef('refund', ret.id),
      },
    });

    if (canTransitionSafe(ret.order.status, 'REFUND_PENDING')) {
      await tx.order.update({ where: { id: ret.orderId }, data: { status: 'REFUND_PENDING' } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: ret.orderId,
          fromStatus: ret.order.status,
          toStatus: 'REFUND_PENDING',
          reason: 'Return approved',
        },
      });
    }
  });

  return sendReturnRefund(returnId);
}

function serializeRefund<T extends { amount: bigint }>(refund: T) {
  return { ...refund, amount: String(refund.amount) };
}

/** The MoMo number the customer paid from, as recorded when the collection was started. */
function payerMsisdn(transactions: Array<{ rawPayload: Prisma.JsonValue }>) {
  for (const t of transactions) {
    const raw = (t.rawPayload || {}) as { msisdn?: unknown };
    if (typeof raw.msisdn === 'string' && raw.msisdn) return raw.msisdn;
  }
  return null;
}

/**
 * Pushes the pending refund for a return back to the payer. A refund FDI rejected gets a fresh
 * trxRef; one whose push call errored keeps its trxRef so a retry cannot pay twice.
 */
export async function sendReturnRefund(returnId: string) {
  let refund = await prisma.refund.findFirst({
    where: { returnId, status: { in: ['INITIATED', 'FAILED'] } },
    orderBy: { createdAt: 'desc' },
    include: { payment: { include: { transactions: { orderBy: { createdAt: 'asc' } } } } },
  });
  if (!refund) throw Errors.conflict('No refund is waiting to be sent for this return');

  if (refund.status === 'FAILED') {
    refund = await prisma.refund.update({
      where: { id: refund.id },
      data: { status: 'INITIATED', providerRef: buildTrxRef('refund', returnId) },
      include: { payment: { include: { transactions: { orderBy: { createdAt: 'asc' } } } } },
    });
  }

  const msisdn = payerMsisdn(refund.payment.transactions);
  if (!msisdn) throw Errors.conflict('The paying Mobile Money number for this order is unknown');

  try {
    await fdiMomoPush({ trxRef: refund.providerRef!, msisdn, amount: Number(refund.amount) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mobile Money refund failed';
    throw Errors.validation(`Return approved but the refund was not sent: ${message}`);
  }

  const sent = await prisma.refund.update({ where: { id: refund.id }, data: { status: 'PENDING' } });
  return { returnId, refund: serializeRefund(sent) };
}

/** Reconciles a sent refund with FDI (called by the webhook and the admin "check status" action). */
export async function syncRefundWithProvider(providerRef: string) {
  const refund = await prisma.refund.findFirst({
    where: { providerRef },
    include: { payment: true, returnRequest: { include: { order: true } } },
  });
  if (!refund) throw Errors.notFound('Refund');
  if (!['INITIATED', 'PENDING'].includes(refund.status)) {
    return { returnId: refund.returnId, refund: serializeRefund(refund) };
  }

  const live = await fdiGetTransaction(providerRef);
  if (live.status === 'SUCCESSFUL') {
    const done = await prisma.$transaction(async (tx) => {
      const moved = await tx.refund.updateMany({
        where: { id: refund.id, status: { in: ['INITIATED', 'PENDING'] } },
        data: { status: 'REFUNDED' },
      });
      if (moved.count === 0) return false;

      const refunded = await tx.refund.aggregate({
        where: { paymentId: refund.paymentId, status: 'REFUNDED' },
        _sum: { amount: true },
      });
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: (refunded._sum.amount ?? 0n) >= refund.payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      if (refund.returnRequest) {
        await tx.returnRequest.update({
          where: { id: refund.returnRequest.id },
          data: { status: 'REFUNDED' },
        });
        const order = refund.returnRequest.order;
        if (order.status === 'REFUND_PENDING') {
          await tx.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: 'REFUND_PENDING',
              toStatus: 'REFUNDED',
              reason: 'Mobile Money refund confirmed',
            },
          });
        }
      }
      return true;
    });
    if (done) domainEvents.emit('RefundCompleted', { refundId: refund.id });
  } else if (live.status === 'FAILED') {
    await prisma.refund.updateMany({
      where: { id: refund.id, status: { in: ['INITIATED', 'PENDING'] } },
      data: { status: 'FAILED' },
    });
  }

  const refreshed = await prisma.refund.findUniqueOrThrow({ where: { id: refund.id } });
  return { returnId: refund.returnId, refund: serializeRefund(refreshed) };
}

export async function checkReturnRefund(returnId: string) {
  const refund = await prisma.refund.findFirst({
    where: { returnId },
    orderBy: { createdAt: 'desc' },
  });
  if (!refund?.providerRef) throw Errors.conflict('No refund has been started for this return');
  return syncRefundWithProvider(refund.providerRef);
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
