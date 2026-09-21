import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import { notifyUser } from './notification.service';

const INBOX_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SUPPORT', 'ORDER_ADMIN'];

export function canManageInbox(roles: string[]) {
  return roles.some((r) => INBOX_ADMIN_ROLES.includes(r));
}

export async function startOrGetThread(input: {
  customerId: string;
  sellerId: string;
  productId?: string;
  orderId?: string;
}) {
  const seller = await prisma.sellerProfile.findUnique({ where: { id: input.sellerId } });
  if (!seller) throw Errors.notFound('Seller');

  const existing = await prisma.messageThread.findFirst({
    where: {
      customerId: input.customerId,
      sellerId: input.sellerId,
      productId: input.productId ?? null,
      orderId: input.orderId ?? null,
    },
  });
  if (existing) return existing;

  return prisma.messageThread.create({
    data: {
      customerId: input.customerId,
      sellerId: input.sellerId,
      productId: input.productId,
      orderId: input.orderId,
    },
  });
}

export async function sendMessage(
  senderId: string,
  input: {
    threadId?: string;
    sellerId?: string;
    productId?: string;
    orderId?: string;
    body: string;
  },
  asAdmin = false,
) {
  let threadId = input.threadId;

  if (!threadId) {
    if (!input.sellerId) throw Errors.validation('sellerId or threadId is required');
    // Determine if sender is customer (default) — sellers reply on existing threads
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: senderId },
    });

    if (sellerProfile && sellerProfile.id === input.sellerId) {
      throw Errors.validation('Sellers must reply within an existing thread');
    }

    const thread = await startOrGetThread({
      customerId: senderId,
      sellerId: input.sellerId,
      productId: input.productId,
      orderId: input.orderId,
    });
    threadId = thread.id;
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
  });
  if (!thread) throw Errors.notFound('Message thread');

  const sellerUserId = (
    await prisma.sellerProfile.findUniqueOrThrow({ where: { id: thread.sellerId } })
  ).userId;

  const isParticipant = senderId === thread.customerId || senderId === sellerUserId;
  if (!isParticipant && !asAdmin) throw Errors.forbidden();

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        threadId: thread.id,
        senderId,
        body: input.body,
      },
    });
    await tx.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });
    return msg;
  });

  const recipientId = senderId === thread.customerId ? sellerUserId : thread.customerId;
  await notifyUser({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    title: 'New message',
    body: input.body.slice(0, 120),
    data: { threadId: thread.id, messageId: message.id },
  });

  return { threadId: thread.id, message };
}

export async function listThreads(userId: string, all = false) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });

  const threads = await prisma.messageThread.findMany({
    where: all
      ? undefined
      : {
          OR: [{ customerId: userId }, ...(seller ? [{ sellerId: seller.id }] : [])],
        },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return {
    items: await Promise.all(
      threads.map(async (t) => {
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { id: t.sellerId },
          select: { businessName: true, userId: true },
        });
        const customer = await prisma.user.findUnique({
          where: { id: t.customerId },
          select: { fullName: true },
        });
        return {
          id: t.id,
          productId: t.productId,
          orderId: t.orderId,
          updatedAt: t.updatedAt,
          sellerName: sellerProfile?.businessName,
          customerName: customer?.fullName,
          lastMessage: t.messages[0] || null,
        };
      }),
    ),
  };
}

export async function getThreadMessages(userId: string, threadId: string, asAdmin = false) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread) throw Errors.notFound('Message thread');

  const seller = await prisma.sellerProfile.findUnique({ where: { id: thread.sellerId } });
  const isParticipant = userId === thread.customerId || userId === seller?.userId;
  if (!isParticipant && !asAdmin) throw Errors.forbidden();

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, fullName: true } } },
  });

  await prisma.message.updateMany({
    where: {
      threadId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return {
    thread: {
      id: thread.id,
      customerId: thread.customerId,
      sellerId: thread.sellerId,
      productId: thread.productId,
      orderId: thread.orderId,
    },
    messages,
  };
}
