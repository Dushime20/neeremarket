import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import { env } from '../config/env';
import { getPaymentProvider } from '../providers/payment/payment-provider';
import { commitReservedStock, releaseReservedStock, reserveStock } from './inventory.service';
import { assertOrderTransition } from './order-state';
import { domainEvents } from '../events/bus';
import { clearCart } from './cart.service';
import { getAddressForUser } from './address.service';
import type { z } from 'zod';
import type { checkoutSchema } from '../validators/commerce.validator';

type CheckoutInput = z.infer<typeof checkoutSchema>;
type Tx = Prisma.TransactionClient;

async function nextOrderNumber(tx: Tx) {
  const count = await tx.order.count();
  return `ORD-${10001 + count}`;
}

function serializeMoneyOrder(order: {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: bigint;
  deliveryFee: bigint;
  discountTotal: bigint;
  platformCharges: bigint;
  total: bigint;
  createdAt: Date;
  paidAt: Date | null;
  sellerOrders?: Array<{
    id: string;
    sellerOrderNumber: string;
    status: string;
    subtotal: bigint;
    deliveryFee: bigint;
    seller: { businessName: string };
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      sku: string;
      quantity: number;
      unitPrice: bigint;
      lineTotal: bigint;
    }>;
  }>;
  payments?: Array<{
    id: string;
    status: string;
    method: string;
    provider: string;
    providerRef: string | null;
    amount: bigint;
  }>;
  address?: unknown;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    currency: order.currency,
    subtotal: String(order.subtotal),
    deliveryFee: String(order.deliveryFee),
    discountTotal: String(order.discountTotal),
    platformCharges: String(order.platformCharges),
    total: String(order.total),
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    address: order.address,
    payments: order.payments?.map((p) => ({
      ...p,
      amount: String(p.amount),
    })),
    sellerOrders: order.sellerOrders?.map((so) => ({
      id: so.id,
      sellerOrderNumber: so.sellerOrderNumber,
      status: so.status,
      subtotal: String(so.subtotal),
      deliveryFee: String(so.deliveryFee),
      sellerName: so.seller.businessName,
      items: so.items.map((item) => ({
        ...item,
        unitPrice: String(item.unitPrice),
        lineTotal: String(item.lineTotal),
      })),
    })),
  };
}

export async function checkout(userId: string, input: CheckoutInput) {
  const existingPayment = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: {
      order: {
        include: {
          sellerOrders: { include: { seller: true, items: true } },
          payments: true,
          address: true,
        },
      },
    },
  });

  if (existingPayment?.order) {
    return {
      order: serializeMoneyOrder(existingPayment.order),
      payment: {
        id: existingPayment.id,
        status: existingPayment.status,
        providerRef: existingPayment.providerRef,
        method: existingPayment.method,
        amount: String(existingPayment.amount),
      },
      idempotent: true,
    };
  }

  const address = await getAddressForUser(userId, input.addressId);

  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              inventory: true,
              product: {
                include: { store: { include: { seller: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw Errors.validation('Cart is empty');
  }

  type Line = {
    variantId: string;
    productId: string;
    sellerId: string;
    productName: string;
    variantName: string | null;
    sku: string;
    quantity: number;
    unitPrice: bigint;
    lineTotal: bigint;
  };

  const lines: Line[] = [];
  for (const item of cart.items) {
    const { variant } = item;
    if (variant.product.status !== 'ACTIVE' || variant.product.deletedAt) {
      throw Errors.conflict(`Product unavailable: ${variant.product.name}`);
    }
    if (variant.product.store.seller.verificationStatus === 'SUSPENDED') {
      throw Errors.forbidden('A seller in your cart is suspended');
    }
    const available = variant.inventory
      ? variant.inventory.quantity - variant.inventory.reserved
      : 0;
    if (available < item.quantity) {
      throw Errors.insufficientStock();
    }
    const unitPrice = variant.price ?? variant.product.discountPrice ?? variant.product.price;
    lines.push({
      variantId: variant.id,
      productId: variant.product.id,
      sellerId: variant.product.store.seller.id,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * BigInt(item.quantity),
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0n);
  const deliveryFee =
    input.deliveryMethod === 'CUSTOMER_PICKUP' ? 0n : 2000n * BigInt(new Set(lines.map((l) => l.sellerId)).size);
  const discountTotal = 0n;
  const platformCharges = 0n;
  const total = subtotal + deliveryFee - discountTotal + platformCharges;

  const sellerIds = [...new Set(lines.map((l) => l.sellerId))];
  const provider = getPaymentProvider(env.PAYMENT_PROVIDER);

  const result = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx);

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: userId,
        addressId: address.id,
        status: 'PENDING_PAYMENT',
        currency: env.DEFAULT_CURRENCY,
        subtotal,
        deliveryFee,
        discountTotal,
        platformCharges,
        total,
        couponCode: input.couponCode,
        notes: input.notes,
        statusHistory: {
          create: {
            toStatus: 'PENDING_PAYMENT',
            actorId: userId,
            reason: 'Checkout started',
          },
        },
      },
    });

    let sellerIndex = 1;
    for (const sellerId of sellerIds) {
      const sellerLines = lines.filter((l) => l.sellerId === sellerId);
      const sellerSubtotal = sellerLines.reduce((s, l) => s + l.lineTotal, 0n);
      const sellerDelivery =
        input.deliveryMethod === 'CUSTOMER_PICKUP' ? 0n : 2000n;

      const sellerOrder = await tx.sellerOrder.create({
        data: {
          orderId: order.id,
          sellerId,
          sellerOrderNumber: `${orderNumber}-S${sellerIndex}`,
          status: 'PENDING_PAYMENT',
          subtotal: sellerSubtotal,
          deliveryFee: sellerDelivery,
          commissionTotal: 0n,
          sellerEarnings: 0n,
        },
      });
      sellerIndex += 1;

      for (const line of sellerLines) {
        await tx.orderItem.create({
          data: {
            sellerOrderId: sellerOrder.id,
            variantId: line.variantId,
            productName: line.productName,
            variantName: line.variantName,
            sku: line.sku,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
            currency: env.DEFAULT_CURRENCY,
          },
        });

        await reserveStock(tx, line.variantId, line.quantity, order.id, userId);
      }
    }

    await tx.delivery.create({
      data: {
        orderId: order.id,
        method: input.deliveryMethod,
        status: 'PENDING',
        fee: deliveryFee,
      },
    });

    let payment;
    try {
      payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: provider.code,
          method: input.paymentMethod,
          amount: total,
          currency: env.DEFAULT_CURRENCY,
          status: 'INITIATED',
          idempotencyKey: input.idempotencyKey,
        },
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
        throw Errors.conflict('Duplicate checkout request');
      }
      throw err;
    }

    const providerResult = await provider.createPayment({
      amount: Number(total),
      currency: env.DEFAULT_CURRENCY,
      orderId: order.id,
      customerPhone: input.customerPhone || address.phone,
      idempotencyKey: input.idempotencyKey,
      method: input.paymentMethod,
    });

    payment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING',
        providerRef: providerResult.providerRef,
      },
    });

    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        providerRef: providerResult.providerRef,
        status: providerResult.status,
        rawPayload: providerResult.raw as object | undefined,
      },
    });

    const full = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        sellerOrders: { include: { seller: true, items: true } },
        payments: true,
        address: true,
      },
    });

    return { order: full, payment };
  });

  domainEvents.emit('OrderCreated', { orderId: result.order.id });

  return {
    order: serializeMoneyOrder(result.order),
    payment: {
      id: result.payment.id,
      status: result.payment.status,
      providerRef: result.payment.providerRef,
      method: result.payment.method,
      amount: String(result.payment.amount),
    },
    idempotent: false,
  };
}

export async function confirmPaymentFromWebhook(
  providerCode: string,
  headers: Record<string, string | string[] | undefined>,
  body: unknown,
) {
  const provider = getPaymentProvider(providerCode === 'mock' ? 'mock' : env.PAYMENT_PROVIDER);
  const verified = await provider.verifyWebhook(headers, body);
  const payloadHash = createHash('sha256')
    .update(JSON.stringify({ providerCode, ...verified, body }))
    .digest('hex');

  const existingWebhook = await prisma.paymentWebhook.findUnique({
    where: { payloadHash },
  });
  if (existingWebhook?.processedAt) {
    return { duplicate: true, status: 'ALREADY_PROCESSED' };
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: verified.providerRef },
    include: {
      order: {
        include: {
          sellerOrders: { include: { items: true } },
        },
      },
    },
  });

  if (!payment) throw Errors.notFound('Payment');

  await prisma.paymentWebhook.create({
    data: {
      paymentId: payment.id,
      provider: provider.code,
      payloadHash,
      payload: body as object,
      processedAt: new Date(),
    },
  });

  if (payment.status === 'PAID') {
    return { duplicate: true, status: 'PAID' };
  }

  if (verified.status === 'FAILED' || verified.status === 'CANCELLED') {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: verified.status === 'CANCELLED' ? 'CANCELLED' : 'FAILED' },
      });

      for (const sellerOrder of payment.order.sellerOrders) {
        for (const item of sellerOrder.items) {
          await releaseReservedStock(tx, item.variantId, item.quantity, payment.orderId);
        }
        await tx.sellerOrder.update({
          where: { id: sellerOrder.id },
          data: { status: 'CANCELLED' },
        });
      }

      if (payment.order.status === 'PENDING_PAYMENT') {
        assertOrderTransition(payment.order.status, 'CANCELLED');
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: 'PENDING_PAYMENT',
            toStatus: 'CANCELLED',
            reason: `Payment ${verified.status}`,
          },
        });
      }
    });

    domainEvents.emit('PaymentFailed', {
      paymentId: payment.id,
      orderId: payment.orderId,
    });

    return { duplicate: false, status: verified.status };
  }

  if (verified.status !== 'PAID') {
    return { duplicate: false, status: verified.status };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await tx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        providerRef: verified.providerRef,
        status: 'PAID',
        rawPayload: body as object,
      },
    });

    assertOrderTransition(payment.order.status, 'PAID');
    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID', paidAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: payment.orderId,
        fromStatus: payment.order.status,
        toStatus: 'PAID',
        reason: 'Payment webhook confirmed',
      },
    });

    for (const sellerOrder of payment.order.sellerOrders) {
      await tx.sellerOrder.update({
        where: { id: sellerOrder.id },
        data: { status: 'PAID' },
      });
      for (const item of sellerOrder.items) {
        await commitReservedStock(tx, item.variantId, item.quantity, payment.orderId);
        await tx.product.update({
          where: { id: (await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId } })).productId },
          data: { salesCount: { increment: item.quantity } },
        });
      }
    }
  });

  await clearCart(payment.order.customerId);
  domainEvents.emit('PaymentCompleted', {
    paymentId: payment.id,
    orderId: payment.orderId,
  });

  const { settleOrderAfterPayment } = await import('./finance.service');
  await settleOrderAfterPayment(payment.orderId);

  // Auto-confirm for seller processing
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    if (order.status === 'PAID') {
      assertOrderTransition('PAID', 'CONFIRMED');
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });
      await tx.sellerOrder.updateMany({
        where: { orderId: order.id },
        data: { status: 'CONFIRMED' },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'PAID',
          toStatus: 'CONFIRMED',
          reason: 'Auto-confirmed after payment',
        },
      });
    }
  });

  return { duplicate: false, status: 'PAID' };
}

/** Dev/demo helper: simulate MoMo/Airtel success without external provider */
export async function mockPayOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: { payments: true },
  });
  if (!order) throw Errors.notFound('Order');
  const payment = order.payments[0];
  if (!payment?.providerRef) throw Errors.conflict('No payment to confirm');

  return confirmPaymentFromWebhook('mock', {}, {
    providerRef: payment.providerRef,
    status: 'PAID',
    amount: Number(payment.amount),
  });
}

export async function listCustomerOrders(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where = { customerId: userId };
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sellerOrders: { include: { seller: true, items: true } },
        payments: true,
        address: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map(serializeMoneyOrder),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      sellerOrders: { include: { seller: true, items: true } },
      payments: true,
      address: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      deliveries: true,
    },
  });
  if (!order) throw Errors.notFound('Order');
  return {
    ...serializeMoneyOrder(order),
    statusHistory: order.statusHistory,
    deliveries: order.deliveries.map((d) => ({
      ...d,
      fee: String(d.fee),
    })),
  };
}

export async function listSellerOrders(userId: string, status?: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!seller) throw Errors.notFound('Seller profile');

  const orders = await prisma.sellerOrder.findMany({
    where: {
      sellerId: seller.id,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      order: {
        select: {
          orderNumber: true,
          createdAt: true,
          customerId: true,
          address: true,
        },
      },
    },
  });

  return {
    items: orders.map((o) => ({
      id: o.id,
      sellerOrderNumber: o.sellerOrderNumber,
      status: o.status,
      subtotal: String(o.subtotal),
      deliveryFee: String(o.deliveryFee),
      createdAt: o.createdAt,
      parentOrderNumber: o.order.orderNumber,
      items: o.items.map((i) => ({
        ...i,
        unitPrice: String(i.unitPrice),
        lineTotal: String(i.lineTotal),
      })),
      address: o.order.address,
    })),
  };
}
