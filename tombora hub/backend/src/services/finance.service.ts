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

type Tx = Prisma.TransactionClient;

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

export async function requestPayout(
  userId: string,
  amount: number,
  method: string,
  destination: Record<string, unknown>,
) {
  if (amount <= 0) throw Errors.validation('Payout amount must be positive');

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
        destination: destination as Prisma.InputJsonValue,
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

    return {
      ...payout,
      amount: String(payout.amount),
    };
  });
}

export async function reviewPayout(
  payoutId: string,
  action: 'APPROVE' | 'CANCEL',
  notes?: string,
) {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) throw Errors.notFound('Payout');
    if (!['REQUESTED', 'UNDER_REVIEW'].includes(payout.status)) {
      throw Errors.conflict(`Cannot review payout in status ${payout.status}`);
    }

    if (action === 'CANCEL') {
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
          description: 'Payout cancelled — funds restored',
        },
      });
      return tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'CANCELLED', reviewNotes: notes },
      });
    }

    return tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'APPROVED', reviewNotes: notes },
    });
  });
}

export async function processPayout(payoutId: string) {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) throw Errors.notFound('Payout');
    if (payout.status !== 'APPROVED') {
      throw Errors.conflict('Payout must be APPROVED before processing');
    }

    await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'PROCESSING' },
    });

    await tx.payoutTransaction.create({
      data: {
        payoutRequestId: payoutId,
        providerRef: `PAYOUT-${payoutId.slice(0, 8)}`,
        status: 'PAID',
        rawPayload: { simulated: true, method: payout.method },
      },
    });

    const updated = await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'PAID', processedAt: new Date() },
    });

    domainEvents.emit('PayoutCompleted', { payoutId });
    return { ...updated, amount: String(updated.amount) };
  });
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

export async function updateSellerOrderStatus(
  userId: string,
  sellerOrderId: string,
  toStatus: 'PROCESSING' | 'READY_FOR_SHIPMENT' | 'SHIPPED' | 'DELIVERED',
) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!seller) throw Errors.notFound('Seller profile');

  return prisma.$transaction(async (tx) => {
    const sellerOrder = await tx.sellerOrder.findFirst({
      where: { id: sellerOrderId, sellerId: seller.id },
      include: { order: true },
    });
    if (!sellerOrder) throw Errors.notFound('Seller order');

    assertOrderTransition(sellerOrder.status, toStatus);

    await tx.sellerOrder.update({
      where: { id: sellerOrderId },
      data: { status: toStatus },
    });

    if (toStatus === 'DELIVERED') {
      await releaseSellerOrderEarnings(tx, sellerOrderId);

      const siblings = await tx.sellerOrder.findMany({
        where: { orderId: sellerOrder.orderId },
      });
      const allDelivered = siblings.every(
        (s) =>
          s.id === sellerOrderId ||
          ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(s.status),
      );

      if (allDelivered && canMoveParent(sellerOrder.order.status, 'DELIVERED')) {
        await tx.order.update({
          where: { id: sellerOrder.orderId },
          data: { status: 'DELIVERED' },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: sellerOrder.orderId,
            fromStatus: sellerOrder.order.status,
            toStatus: 'DELIVERED',
            actorId: userId,
            reason: 'All seller orders delivered',
          },
        });
        domainEvents.emit('OrderDelivered', { orderId: sellerOrder.orderId });
      }
    }

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
