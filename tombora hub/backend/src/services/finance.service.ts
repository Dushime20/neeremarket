import type { Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import { env } from '../config/env';
import {
  calculateCommissionAmount,
  resolveCommissionRule,
} from './commission.engine';
import { assertOrderTransition } from './order-state';
import { domainEvents } from '../events/bus';
import { writeAuditLog } from './audit.service';
import {
  buildTrxRef,
  fdiGetTransaction,
  fdiMomoPush,
  inferChannel,
  isValidRwandaMsisdn,
  normalizeMsisdn,
} from '../providers/payment/fdi.client';

type Tx = Prisma.TransactionClient;

const MIN_MOMO_AMOUNT = 100;

async function ensureWallet(tx: Tx, sellerId: string) {
  const existing = await tx.sellerWallet.findUnique({ where: { sellerId } });
  if (existing) return existing;
  return tx.sellerWallet.create({
    data: { sellerId, currency: env.DEFAULT_CURRENCY },
  });
}

/**
 * Posts SALE + COMMISSION ledger entries and updates pending wallet.
 * Idempotent per order item via unique commission_transactions.orderItemId.
 */
export async function settleSellerOrderCommissions(tx: Tx, sellerOrderId: string) {
  const sellerOrder = await tx.sellerOrder.findUniqueOrThrow({
    where: { id: sellerOrderId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
          commissionTransactions: true,
        },
      },
    },
  });

  let commissionTotal = 0n;
  let earningsTotal = 0n;

  for (const item of sellerOrder.items) {
    if (item.commissionTransactions.length > 0) {
      commissionTotal += item.commissionAmount;
      earningsTotal += item.lineTotal - item.commissionAmount;
      continue;
    }

    const product = item.variant.product;
    const rule = await resolveCommissionRule(tx, {
      productId: product.id,
      categoryId: product.categoryId,
      sellerId: sellerOrder.sellerId,
      lineTotal: item.lineTotal,
    });

    const rateBps = rule?.rateBps ?? env.COMMISSION_DEFAULT_RATE_BPS;
    const commissionAmount = calculateCommissionAmount(
      item.lineTotal,
      rateBps,
      rule?.fixedAmount,
    );
    const sellerNet = item.lineTotal - commissionAmount;

    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        commissionRateBps: rateBps,
        commissionAmount,
      },
    });

    await tx.commissionTransaction.create({
      data: {
        orderItemId: item.id,
        ruleId: rule?.id,
        rateBps,
        amount: commissionAmount,
        currency: env.DEFAULT_CURRENCY,
      },
    });

    await tx.sellerLedger.create({
      data: {
        sellerId: sellerOrder.sellerId,
        entryType: 'SALE',
        amount: item.lineTotal,
        currency: env.DEFAULT_CURRENCY,
        balanceBucket: 'PENDING',
        refType: 'ORDER_ITEM',
        refId: item.id,
        description: `Sale ${item.productName}`,
      },
    });

    await tx.sellerLedger.create({
      data: {
        sellerId: sellerOrder.sellerId,
        entryType: 'COMMISSION',
        amount: -commissionAmount,
        currency: env.DEFAULT_CURRENCY,
        balanceBucket: 'PENDING',
        refType: 'ORDER_ITEM',
        refId: item.id,
        description: `Platform commission ${rateBps / 100}%`,
      },
    });

    commissionTotal += commissionAmount;
    earningsTotal += sellerNet;
  }

  const wallet = await ensureWallet(tx, sellerOrder.sellerId);
  await tx.sellerWallet.update({
    where: { id: wallet.id },
    data: { pendingBalance: wallet.pendingBalance + earningsTotal },
  });

  await tx.sellerOrder.update({
    where: { id: sellerOrder.id },
    data: {
      commissionTotal,
      sellerEarnings: earningsTotal,
    },
  });

  return { commissionTotal, earningsTotal };
}

/** Move pending earnings for a seller order into available balance. */
export async function releaseSellerOrderEarnings(tx: Tx, sellerOrderId: string) {
  const sellerOrder = await tx.sellerOrder.findUniqueOrThrow({
    where: { id: sellerOrderId },
  });

  if (sellerOrder.sellerEarnings <= 0n) return;

  const alreadyReleased = await tx.sellerLedger.findFirst({
    where: {
      sellerId: sellerOrder.sellerId,
      entryType: 'AVAILABLE_RELEASE',
      refType: 'SELLER_ORDER',
      refId: sellerOrderId,
    },
  });
  if (alreadyReleased) return;

  const wallet = await ensureWallet(tx, sellerOrder.sellerId);
  if (wallet.pendingBalance < sellerOrder.sellerEarnings) {
    throw Errors.conflict('Insufficient pending balance to release');
  }

  await tx.sellerLedger.create({
    data: {
      sellerId: sellerOrder.sellerId,
      entryType: 'AVAILABLE_RELEASE',
      amount: sellerOrder.sellerEarnings,
      currency: env.DEFAULT_CURRENCY,
      balanceBucket: 'AVAILABLE',
      refType: 'SELLER_ORDER',
      refId: sellerOrderId,
      description: `Release earnings for ${sellerOrder.sellerOrderNumber}`,
    },
  });

  await tx.sellerWallet.update({
    where: { id: wallet.id },
    data: {
      pendingBalance: wallet.pendingBalance - sellerOrder.sellerEarnings,
      availableBalance: wallet.availableBalance + sellerOrder.sellerEarnings,
    },
  });
}

export async function getSellerFinance(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { wallet: true },
  });
  if (!seller) throw Errors.notFound('Seller profile');

  const [ledger, payouts, sales] = await Promise.all([
    prisma.sellerLedger.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.payoutRequest.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.sellerOrder.aggregate({
      where: {
        sellerId: seller.id,
        status: { in: ['PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'] },
      },
      _sum: { subtotal: true, commissionTotal: true, sellerEarnings: true },
      _count: true,
    }),
  ]);

  const wallet = seller.wallet;
  return {
    wallet: wallet
      ? {
          pendingBalance: String(wallet.pendingBalance),
          availableBalance: String(wallet.availableBalance),
          currency: wallet.currency,
        }
      : { pendingBalance: '0', availableBalance: '0', currency: 'RWF' },
    totals: {
      orders: sales._count,
      sales: String(sales._sum.subtotal ?? 0n),
      commission: String(sales._sum.commissionTotal ?? 0n),
      earnings: String(sales._sum.sellerEarnings ?? 0n),
      withdrawals: String(
        payouts
          .filter((p) => p.status === 'PAID')
          .reduce((s, p) => s + p.amount, 0n),
      ),
    },
    ledger: ledger.map((e) => ({
      ...e,
      amount: String(e.amount),
    })),
    payouts: payouts.map((p) => ({
      ...p,
      amount: String(p.amount),
    })),
  };
}

export async function requestPayout(userId: string, amount: number, phone: string, ip?: string) {
  if (amount < MIN_MOMO_AMOUNT) {
    throw Errors.validation(`Withdrawals must be at least ${MIN_MOMO_AMOUNT} RWF`);
  }
  if (!isValidRwandaMsisdn(phone)) {
    throw Errors.validation('Enter a valid Rwanda MoMo number (MTN 078/079 or Airtel 072/073)');
  }
  const msisdn = normalizeMsisdn(phone);
  const method = inferChannel(msisdn).includes('airtel') ? 'AIRTEL_MONEY' : 'MTN_MOMO';
  const destination = { phone: msisdn };

  return prisma.$transaction(async (tx) => {
    const seller = await tx.sellerProfile.findUnique({ where: { userId } });
    if (!seller) throw Errors.notFound('Seller profile');

    const wallet = await ensureWallet(tx, seller.id);
    const amt = BigInt(amount);
    if (wallet.availableBalance < amt) {
      throw Errors.conflict('Insufficient available balance');
    }

    await tx.sellerWallet.update({
      where: { id: wallet.id },
      data: { availableBalance: wallet.availableBalance - amt },
    });

    const payout = await tx.payoutRequest.create({
      data: {
        sellerId: seller.id,
        amount: amt,
        currency: env.DEFAULT_CURRENCY,
        method,
        destination,
        status: 'REQUESTED',
      },
    });

    await tx.sellerLedger.create({
      data: {
        sellerId: seller.id,
        entryType: 'PAYOUT',
        amount: -amt,
        currency: env.DEFAULT_CURRENCY,
        balanceBucket: 'AVAILABLE',
        refType: 'PAYOUT',
        refId: payout.id,
        description: 'Payout requested — funds held',
      },
    });

    await writeAuditLog({
      actorId: userId,
      action: 'payout.request',
      entityType: 'PayoutRequest',
      entityId: payout.id,
      after: {
        amount: String(amt),
        currency: env.DEFAULT_CURRENCY,
        method,
        destination,
      },
      reason: `Seller requested withdrawal of ${amount} RWF`,
      ip,
    });

    return {
      ...payout,
      amount: String(payout.amount),
    };
  });
}

async function restorePayoutFunds(tx: Tx, payout: { id: string; sellerId: string; amount: bigint; currency: string }, description: string) {
  const wallet = await ensureWallet(tx, payout.sellerId);
  await tx.sellerWallet.update({
    where: { id: wallet.id },
    data: { availableBalance: wallet.availableBalance + payout.amount },
  });
  await tx.sellerLedger.create({
    data: {
      sellerId: payout.sellerId,
      entryType: 'ADJUSTMENT',
      amount: payout.amount,
      currency: payout.currency,
      balanceBucket: 'AVAILABLE',
      refType: 'PAYOUT',
      refId: payout.id,
      description,
    },
  });
}

function serializePayout<T extends { amount: bigint }>(payout: T) {
  return { ...payout, amount: String(payout.amount) };
}

/** Approving a payout immediately sends the Mobile Money transfer. */
async function assertNoTransferInFlight(payoutId: string) {
  const attempts = await prisma.payoutTransaction.findMany({
    where: { payoutRequestId: payoutId, status: 'INITIATED' },
  });
  for (const attempt of attempts) {
    if (!attempt.providerRef) continue;
    const live = await fdiGetTransaction(attempt.providerRef);
    if (live.status === 'SUCCESSFUL' || live.status === 'PENDING') {
      throw Errors.conflict('A transfer for this payout already reached Mobile Money; it cannot be cancelled');
    }
    await prisma.payoutTransaction.update({ where: { id: attempt.id }, data: { status: 'FAILED' } });
  }
}

export async function reviewPayout(
  payoutId: string,
  action: 'APPROVE' | 'CANCEL',
  notes?: string,
  actorId?: string,
  ip?: string,
) {
  if (action === 'CANCEL') await assertNoTransferInFlight(payoutId);

  const reviewed = await prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) throw Errors.notFound('Payout');

    if (action === 'CANCEL') {
      // APPROVED payouts can still be cancelled when the transfer never reached FDI.
      if (!['REQUESTED', 'UNDER_REVIEW', 'APPROVED'].includes(payout.status)) {
        throw Errors.conflict(`Cannot cancel a payout in status ${payout.status}`);
      }
      await restorePayoutFunds(tx, payout, 'Payout cancelled — funds restored');
      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'CANCELLED', reviewNotes: notes },
      });
      await writeAuditLog({
        actorId,
        action: 'payout.cancel',
        entityType: 'PayoutRequest',
        entityId: payoutId,
        before: { status: payout.status },
        after: { status: 'CANCELLED', reviewNotes: notes },
        reason: notes || 'Admin cancelled withdrawal request',
        ip,
      });
      return updated;
    }

    if (!['REQUESTED', 'UNDER_REVIEW'].includes(payout.status)) {
      throw Errors.conflict(`Cannot approve a payout in status ${payout.status}`);
    }
    const updated = await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'APPROVED', reviewNotes: notes },
    });
    await writeAuditLog({
      actorId,
      action: 'payout.approve',
      entityType: 'PayoutRequest',
      entityId: payoutId,
      before: { status: payout.status },
      after: { status: 'APPROVED', reviewNotes: notes },
      reason: notes || 'Admin approved withdrawal request',
      ip,
    });
    return updated;
  });

  if (action === 'APPROVE') return sendPayout(payoutId, actorId, ip);
  return serializePayout(reviewed);
}

/**
 * Pushes an APPROVED payout to the seller's MoMo wallet. If the push call errors the payout
 * returns to APPROVED and a retry reuses the same trxRef, so FDI's idempotency prevents a
 * double transfer.
 */
export async function sendPayout(payoutId: string, actorId?: string, ip?: string) {
  const claimed = await prisma.payoutRequest.updateMany({
    where: { id: payoutId, status: 'APPROVED' },
    data: { status: 'PROCESSING' },
  });
  if (claimed.count === 0) {
    const exists = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!exists) throw Errors.notFound('Payout');
    throw Errors.conflict(`Payout must be APPROVED before sending (current: ${exists.status})`);
  }

  await writeAuditLog({
    actorId,
    action: 'payout.send',
    entityType: 'PayoutRequest',
    entityId: payoutId,
    reason: 'Payout dispatched to Mobile Money gateway',
    ip,
  });

  const payout = await prisma.payoutRequest.findUniqueOrThrow({ where: { id: payoutId } });
  const phone = String((payout.destination as { phone?: string } | null)?.phone || '');

  let attempt = await prisma.payoutTransaction.findFirst({
    where: { payoutRequestId: payoutId, status: 'INITIATED' },
    orderBy: { createdAt: 'desc' },
  });
  if (!attempt) {
    attempt = await prisma.payoutTransaction.create({
      data: {
        payoutRequestId: payoutId,
        providerRef: buildTrxRef('payout', payoutId),
        status: 'INITIATED',
      },
    });
  }

  try {
    const push = await fdiMomoPush({
      trxRef: attempt.providerRef!,
      msisdn: phone,
      amount: Number(payout.amount),
      method: payout.method,
    });
    await prisma.payoutTransaction.update({
      where: { id: attempt.id },
      data: { status: 'PENDING', rawPayload: push },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mobile Money transfer failed';
    await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'APPROVED', reviewNotes: `Transfer not sent: ${message}`.slice(0, 500) },
    });
    throw Errors.validation(`Payout approved but the transfer was not sent: ${message}`);
  }

  const updated = await prisma.payoutRequest.findUniqueOrThrow({ where: { id: payoutId } });
  return serializePayout(updated);
}

/** Reconciles a PROCESSING payout with FDI (called by the webhook and the admin "check status" action). */
export async function syncPayoutWithProvider(providerRef: string) {
  const attempt = await prisma.payoutTransaction.findFirst({
    where: { providerRef },
    include: { payoutRequest: true },
  });
  if (!attempt) throw Errors.notFound('Payout transaction');
  const payout = attempt.payoutRequest;
  if (payout.status !== 'PROCESSING') return serializePayout(payout);

  const live = await fdiGetTransaction(providerRef);
  if (live.status === 'SUCCESSFUL') {
    const done = await prisma.$transaction(async (tx) => {
      const moved = await tx.payoutRequest.updateMany({
        where: { id: payout.id, status: 'PROCESSING' },
        data: { status: 'PAID', processedAt: new Date() },
      });
      if (moved.count === 0) return false;
      await tx.payoutTransaction.update({
        where: { id: attempt.id },
        data: { status: 'PAID', rawPayload: (live.details || {}) as Prisma.InputJsonValue },
      });
      return true;
    });
    if (done) domainEvents.emit('PayoutCompleted', { payoutId: payout.id });
  } else if (live.status === 'FAILED') {
    const done = await prisma.$transaction(async (tx) => {
      const moved = await tx.payoutRequest.updateMany({
        where: { id: payout.id, status: 'PROCESSING' },
        data: { status: 'FAILED', reviewNotes: live.reason?.slice(0, 500) },
      });
      if (moved.count === 0) return false;
      await tx.payoutTransaction.update({
        where: { id: attempt.id },
        data: { status: 'FAILED', rawPayload: (live.details || {}) as Prisma.InputJsonValue },
      });
      await restorePayoutFunds(tx, payout, 'Payout failed — funds restored');
      return true;
    });
    if (done) domainEvents.emit('PayoutFailed', { payoutId: payout.id, reason: live.reason });
  }

  const refreshed = await prisma.payoutRequest.findUniqueOrThrow({ where: { id: payout.id } });
  return serializePayout(refreshed);
}

export async function checkPayoutStatus(payoutId: string) {
  const attempt = await prisma.payoutTransaction.findFirst({
    where: { payoutRequestId: payoutId, status: { in: ['PENDING', 'PAID', 'FAILED'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!attempt?.providerRef) throw Errors.conflict('This payout has not been sent yet');
  return syncPayoutWithProvider(attempt.providerRef);
}

export async function listPayoutsForAdmin(status?: string) {
  const items = await prisma.payoutRequest.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      seller: { select: { businessName: true, businessPhone: true } },
    },
  });
  return items.map((p) => ({
    ...p,
    amount: String(p.amount),
  }));
}

/** Sellers can move a parcel up to "shipped"; only the customer (or an admin) confirms delivery. */
export type SellerFulfilmentStatus = 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'OUT_FOR_DELIVERY';

const AWAITING_RECEIPT = ['SHIPPED', 'OUT_FOR_DELIVERY'];
const ACTIVE_DISPUTE = ['OPEN', 'SELLER_RESPONDED', 'ESCALATED'] as const;

export async function updateSellerOrderStatus(
  userId: string,
  sellerOrderId: string,
  toStatus: SellerFulfilmentStatus,
) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!seller) throw Errors.notFound('Seller profile');

  const result = await prisma.$transaction(async (tx) => {
    const sellerOrder = await tx.sellerOrder.findFirst({
      where: { id: sellerOrderId, sellerId: seller.id },
    });
    if (!sellerOrder) throw Errors.notFound('Seller order');

    assertOrderTransition(sellerOrder.status, toStatus);

    await tx.sellerOrder.update({
      where: { id: sellerOrderId },
      data: { status: toStatus },
    });

    const updated = await tx.sellerOrder.findUniqueOrThrow({
      where: { id: sellerOrderId },
      include: { items: true },
    });

    return {
      ...updated,
      subtotal: String(updated.subtotal),
      deliveryFee: String(updated.deliveryFee),
      commissionTotal: String(updated.commissionTotal),
      sellerEarnings: String(updated.sellerEarnings),
      items: updated.items.map((i) => ({
        ...i,
        unitPrice: String(i.unitPrice),
        lineTotal: String(i.lineTotal),
        commissionAmount: String(i.commissionAmount),
      })),
    };
  });

  if (toStatus === 'SHIPPED') domainEvents.emit('SellerOrderShipped', { sellerOrderId });
  return result;
}

/**
 * The customer confirms a parcel arrived (or an admin does so on their behalf). This is the
 * only path that moves the seller's held earnings into their available balance.
 */
export async function confirmSellerOrderDelivery(input: {
  actorId: string;
  orderId: string;
  sellerOrderId: string;
  /** Set for customer calls so they can only confirm their own orders; omitted for admins. */
  customerId?: string;
}) {
  const { actorId, orderId, sellerOrderId, customerId } = input;

  const { orderDelivered } = await prisma.$transaction(async (tx) => {
    const sellerOrder = await tx.sellerOrder.findFirst({
      where: {
        id: sellerOrderId,
        orderId,
        ...(customerId ? { order: { customerId } } : {}),
      },
      include: {
        order: true,
        disputes: { where: { status: { in: [...ACTIVE_DISPUTE] } }, select: { id: true } },
      },
    });
    if (!sellerOrder) throw Errors.notFound('Seller order');
    if (!AWAITING_RECEIPT.includes(sellerOrder.status)) {
      throw Errors.conflict(
        sellerOrder.status === 'DELIVERED'
          ? 'Delivery was already confirmed for this parcel'
          : 'This parcel has not been shipped yet',
      );
    }
    if (sellerOrder.disputes.length) {
      throw Errors.conflict('Resolve the open dispute on this parcel before confirming delivery');
    }

    assertOrderTransition(sellerOrder.status, 'DELIVERED');
    await tx.sellerOrder.update({
      where: { id: sellerOrderId },
      data: { status: 'DELIVERED' },
    });
    await releaseSellerOrderEarnings(tx, sellerOrderId);

    const siblings = await tx.sellerOrder.findMany({ where: { orderId } });
    const allDone = siblings.every(
      (s) =>
        s.id === sellerOrderId || ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(s.status),
    );
    if (!allDone || !canMoveParent(sellerOrder.order.status, 'DELIVERED')) {
      return { orderDelivered: false };
    }

    const now = new Date();
    await tx.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } });
    await tx.delivery.updateMany({
      where: { orderId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      data: { status: 'DELIVERED', deliveredAt: now },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: sellerOrder.order.status,
        toStatus: 'DELIVERED',
        actorId,
        reason: customerId ? 'Customer confirmed delivery' : 'Admin confirmed delivery',
      },
    });
    return { orderDelivered: true };
  });

  domainEvents.emit('SellerOrderDelivered', { sellerOrderId });
  if (orderDelivered) domainEvents.emit('OrderDelivered', { orderId });
  return { sellerOrderId, orderDelivered };
}

function canMoveParent(from: string, to: string) {
  try {
    assertOrderTransition(from as never, to as never);
    return true;
  } catch {
    return false;
  }
}

/** Settle commissions right after payment confirmation */
export async function settleOrderAfterPayment(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const sellerOrders = await tx.sellerOrder.findMany({ where: { orderId } });
    for (const so of sellerOrders) {
      await settleSellerOrderCommissions(tx, so.id);
    }
  });
}

export async function clawbackRefund(
  tx: Tx,
  orderItemId: string,
  quantity: number,
) {
  const item = await tx.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: {
      sellerOrder: true,
      commissionTransactions: true,
    },
  });

  if (quantity > item.quantity) throw Errors.validation('Refund qty exceeds ordered qty');

  const ratio = BigInt(quantity) * 10000n / BigInt(item.quantity);
  const refundGross = (item.lineTotal * ratio) / 10000n;
  const refundCommission = (item.commissionAmount * ratio) / 10000n;
  const refundNet = refundGross - refundCommission;

  const wallet = await ensureWallet(tx, item.sellerOrder.sellerId);

  // Prefer clawing from pending, then available
  let fromPending = refundNet <= wallet.pendingBalance ? refundNet : wallet.pendingBalance;
  let fromAvailable = refundNet - fromPending;
  if (fromAvailable > wallet.availableBalance) {
    throw Errors.conflict('Insufficient seller balance for refund clawback');
  }

  await tx.sellerLedger.create({
    data: {
      sellerId: item.sellerOrder.sellerId,
      entryType: 'REFUND',
      amount: -refundNet,
      currency: env.DEFAULT_CURRENCY,
      balanceBucket: fromPending > 0n ? 'PENDING' : 'AVAILABLE',
      refType: 'ORDER_ITEM',
      refId: orderItemId,
      description: `Refund clawback x${quantity}`,
    },
  });

  await tx.sellerWallet.update({
    where: { id: wallet.id },
    data: {
      pendingBalance: wallet.pendingBalance - fromPending,
      availableBalance: wallet.availableBalance - fromAvailable,
    },
  });

  return { refundGross, refundCommission, refundNet };
}
