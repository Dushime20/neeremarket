import { randomBytes } from 'node:crypto';
import type { DisputeParty, DisputeStatus, Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import type { AuthUser } from '../shared/middleware';
import { notifyUser } from './notification.service';
import { writeAuditLog } from './audit.service';
import type { CreateDisputeInput, ResolveDisputeInput } from '../validators/dispute.validator';

export const ACTIVE_DISPUTE_STATUSES: DisputeStatus[] = ['OPEN', 'SELLER_RESPONDED', 'ESCALATED'];

const VIEW_PERMISSIONS = ['disputes.manage', 'orders.read'];
const RESOLVE_PERMISSIONS = ['disputes.manage', 'orders.update'];
const DISPUTE_TEAM_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SUPPORT', 'ORDER_ADMIN'];
const REFUND_RESOLUTIONS = ['FULL_REFUND', 'PARTIAL_REFUND', 'RETURN_AND_REFUND'];

type Party = Exclude<DisputeParty, 'SYSTEM'>;

export function canViewDisputesAsAdmin(user: AuthUser) {
  return (
    user.roles.includes('SUPER_ADMIN') ||
    user.permissions.some((p) => VIEW_PERMISSIONS.includes(p))
  );
}

export function canResolveDisputes(user: AuthUser) {
  return (
    user.roles.includes('SUPER_ADMIN') ||
    user.permissions.some((p) => RESOLVE_PERMISSIONS.includes(p))
  );
}

function isActive(status: DisputeStatus) {
  return ACTIVE_DISPUTE_STATUSES.includes(status);
}

function newDisputeNumber() {
  const now = new Date();
  const ymd = `${now.getUTCFullYear() % 100}`.padStart(2, '0') +
    `${now.getUTCMonth() + 1}`.padStart(2, '0') +
    `${now.getUTCDate()}`.padStart(2, '0');
  return `DSP-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

const detailInclude = {
  order: { select: { id: true, orderNumber: true, status: true, total: true, createdAt: true } },
  sellerOrder: {
    select: {
      id: true,
      sellerOrderNumber: true,
      status: true,
      subtotal: true,
      deliveryFee: true,
      items: {
        select: { id: true, productName: true, variantName: true, quantity: true, lineTotal: true },
      },
    },
  },
  customer: { select: { id: true, fullName: true, email: true, phone: true } },
  seller: { select: { id: true, userId: true, businessName: true, businessPhone: true } },
  resolvedBy: { select: { id: true, fullName: true } },
  messages: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, fullName: true } } },
  },
} satisfies Prisma.DisputeInclude;

type DisputeDetail = Prisma.DisputeGetPayload<{ include: typeof detailInclude }>;

const summaryInclude = {
  order: { select: { orderNumber: true } },
  sellerOrder: { select: { sellerOrderNumber: true } },
  customer: { select: { fullName: true } },
  seller: { select: { businessName: true } },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { body: true, authorRole: true, createdAt: true },
  },
  _count: { select: { messages: true } },
} satisfies Prisma.DisputeInclude;

type DisputeSummary = Prisma.DisputeGetPayload<{ include: typeof summaryInclude }>;

function serializeSummary(d: DisputeSummary) {
  return {
    id: d.id,
    disputeNumber: d.disputeNumber,
    type: d.type,
    status: d.status,
    subject: d.subject,
    resolution: d.resolution,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    escalatedAt: d.escalatedAt,
    orderId: d.orderId,
    orderNumber: d.order.orderNumber,
    sellerOrderNumber: d.sellerOrder.sellerOrderNumber,
    sellerName: d.seller.businessName,
    customerName: d.customer.fullName,
    messageCount: d._count.messages,
    lastMessage: d.messages[0] || null,
  };
}

function partyFor(user: AuthUser, dispute: { customerId: string; seller: { userId: string } }): Party | null {
  if (user.id === dispute.customerId) return 'CUSTOMER';
  if (user.id === dispute.seller.userId) return 'SELLER';
  if (canViewDisputesAsAdmin(user)) return 'ADMIN';
  return null;
}

function serializeDetail(d: DisputeDetail, viewer: AuthUser, party: Party) {
  const active = isActive(d.status);
  return {
    id: d.id,
    disputeNumber: d.disputeNumber,
    type: d.type,
    status: d.status,
    subject: d.subject,
    description: d.description,
    desiredOutcome: d.desiredOutcome,
    evidenceUrls: d.evidenceUrls,
    resolution: d.resolution,
    resolutionNote: d.resolutionNote,
    refundAmount: d.refundAmount === null ? null : String(d.refundAmount),
    escalatedAt: d.escalatedAt,
    resolvedAt: d.resolvedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    resolvedBy: party === 'ADMIN' ? d.resolvedBy : null,
    order: { ...d.order, total: String(d.order.total) },
    sellerOrder: {
      ...d.sellerOrder,
      subtotal: String(d.sellerOrder.subtotal),
      deliveryFee: String(d.sellerOrder.deliveryFee),
      items: d.sellerOrder.items.map((i) => ({ ...i, lineTotal: String(i.lineTotal) })),
    },
    customer:
      party === 'SELLER'
        ? { id: d.customer.id, fullName: d.customer.fullName }
        : d.customer,
    seller: {
      id: d.seller.id,
      businessName: d.seller.businessName,
      businessPhone: party === 'CUSTOMER' ? null : d.seller.businessPhone,
    },
    messages: d.messages.map((m) => ({
      id: m.id,
      authorRole: m.authorRole,
      authorName: m.authorRole === 'ADMIN' ? 'NeereMarket support' : m.author?.fullName || null,
      body: m.body,
      attachments: m.attachments,
      createdAt: m.createdAt,
      mine: m.authorId === viewer.id,
    })),
    viewer: {
      role: party,
      canReply: active,
      canWithdraw: active && party === 'CUSTOMER',
      canResolve: active && party === 'ADMIN' && canResolveDisputes(viewer),
    },
  };
}

async function loadDetail(id: string) {
  const dispute = await prisma.dispute.findUnique({ where: { id }, include: detailInclude });
  if (!dispute) throw Errors.notFound('Dispute');
  return dispute;
}

async function loadForParty(user: AuthUser, id: string) {
  const dispute = await loadDetail(id);
  const party = partyFor(user, dispute);
  if (!party) throw Errors.notFound('Dispute');
  return { dispute, party };
}

async function notifyDisputeTeam(input: {
  disputeId: string;
  type: string;
  title: string;
  body: string;
}) {
  const admins = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      roles: { some: { role: { code: { in: DISPUTE_TEAM_ROLES } } } },
    },
    select: { id: true },
    take: 50,
  });
  await Promise.all(
    admins.map((a) =>
      notifyUser({
        userId: a.id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: { disputeId: input.disputeId },
      }),
    ),
  );
}

export async function createDispute(user: AuthUser, input: CreateDisputeInput) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, customerId: user.id },
    include: { sellerOrders: { include: { seller: { select: { id: true, userId: true } } } } },
  });
  if (!order) throw Errors.notFound('Order');

  const sellerOrder = order.sellerOrders.find((so) => so.id === input.sellerOrderId);
  if (!sellerOrder) throw Errors.notFound('Seller parcel');

  if (order.status === 'PENDING_PAYMENT' && input.type !== 'PAYMENT_ISSUE') {
    throw Errors.conflict('This order is not paid yet. Only payment issues can be disputed before payment.');
  }

  const existing = await prisma.dispute.findFirst({
    where: { sellerOrderId: sellerOrder.id, status: { in: ACTIVE_DISPUTE_STATUSES } },
    select: { id: true, disputeNumber: true },
  });
  if (existing) {
    throw Errors.conflict(
      `Dispute ${existing.disputeNumber} is already open for this parcel. Add details to that dispute instead.`,
    );
  }

  const dispute = await prisma.dispute.create({
    data: {
      disputeNumber: newDisputeNumber(),
      orderId: order.id,
      sellerOrderId: sellerOrder.id,
      customerId: user.id,
      sellerId: sellerOrder.sellerId,
      type: input.type,
      subject: input.subject,
      description: input.description,
      desiredOutcome: input.desiredOutcome,
      evidenceUrls: input.evidenceUrls,
    },
  });

  await notifyUser({
    userId: sellerOrder.seller.userId,
    type: 'DISPUTE_OPENED',
    title: `New dispute on ${sellerOrder.sellerOrderNumber}`,
    body: `${input.subject}. Reply to the customer; NeereMarket support is following this dispute.`,
    data: { disputeId: dispute.id, orderId: order.id },
  });
  await notifyDisputeTeam({
    disputeId: dispute.id,
    type: 'DISPUTE_OPENED',
    title: `New dispute ${dispute.disputeNumber} on ${order.orderNumber}`,
    body: input.subject,
  });

  return getDispute(user, dispute.id);
}

export async function getDispute(user: AuthUser, id: string) {
  const { dispute, party } = await loadForParty(user, id);
  return serializeDetail(dispute, user, party);
}

export async function listCustomerDisputes(userId: string, status?: DisputeStatus) {
  const items = await prisma.dispute.findMany({
    where: { customerId: userId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: summaryInclude,
  });
  return { items: items.map(serializeSummary) };
}

export async function listSellerDisputes(userId: string, status?: DisputeStatus) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!seller) throw Errors.notFound('Seller profile');
  const items = await prisma.dispute.findMany({
    where: { sellerId: seller.id, ...(status ? { status } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: summaryInclude,
  });
  return { items: items.map(serializeSummary) };
}

export async function listAdminDisputes(status?: DisputeStatus, q?: string) {
  const where: Prisma.DisputeWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { disputeNumber: { contains: q, mode: 'insensitive' } },
            { subject: { contains: q, mode: 'insensitive' } },
            { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
            { customer: { fullName: { contains: q, mode: 'insensitive' } } },
            { seller: { businessName: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const [items, counts] = await Promise.all([
    prisma.dispute.findMany({
      where,
      orderBy: [{ escalatedAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
      take: 100,
      include: summaryInclude,
    }),
    prisma.dispute.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    items: items.map(serializeSummary),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<
      Record<DisputeStatus, number>
    >,
  };
}

export async function postMessage(
  user: AuthUser,
  id: string,
  input: { body: string; attachments: string[] },
) {
  const { dispute, party } = await loadForParty(user, id);
  if (!isActive(dispute.status)) throw Errors.conflict('This dispute is closed');

  let nextStatus: DisputeStatus | undefined;
  if (party === 'SELLER' && dispute.status === 'OPEN') nextStatus = 'SELLER_RESPONDED';
  if (party === 'ADMIN' && dispute.status !== 'ESCALATED') nextStatus = 'ESCALATED';

  await prisma.$transaction([
    prisma.disputeMessage.create({
      data: {
        disputeId: dispute.id,
        authorId: user.id,
        authorRole: party,
        body: input.body,
        attachments: input.attachments,
      },
    }),
    prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        updatedAt: new Date(),
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextStatus === 'ESCALATED' ? { escalatedAt: new Date() } : {}),
      },
    }),
  ]);

  const recipients = [
    party !== 'CUSTOMER' ? dispute.customerId : null,
    party !== 'SELLER' ? dispute.seller.userId : null,
  ].filter((v): v is string => !!v);
  const from = party === 'ADMIN' ? 'NeereMarket support' : party === 'SELLER' ? dispute.seller.businessName : 'The customer';
  await Promise.all(
    recipients.map((userId) =>
      notifyUser({
        userId,
        type: 'DISPUTE_MESSAGE',
        title: `${from} replied on ${dispute.disputeNumber}`,
        body: input.body.slice(0, 140),
        data: { disputeId: dispute.id },
      }),
    ),
  );

  return getDispute(user, id);
}

export async function withdrawDispute(user: AuthUser, id: string, reason?: string) {
  const { dispute, party } = await loadForParty(user, id);
  if (party !== 'CUSTOMER') throw Errors.forbidden();
  if (!isActive(dispute.status)) throw Errors.conflict('This dispute is already closed');

  await prisma.$transaction([
    prisma.dispute.update({ where: { id }, data: { status: 'WITHDRAWN', resolvedAt: new Date() } }),
    prisma.disputeMessage.create({
      data: {
        disputeId: id,
        authorRole: 'SYSTEM',
        body: `The customer closed this dispute.${reason ? ` Note: ${reason}` : ''}`,
      },
    }),
  ]);

  await notifyUser({
    userId: dispute.seller.userId,
    type: 'DISPUTE_CLOSED',
    title: `${dispute.disputeNumber} was withdrawn`,
    body: 'The customer closed the dispute.',
    data: { disputeId: id },
  });

  return getDispute(user, id);
}

export async function resolveDispute(
  user: AuthUser,
  id: string,
  input: ResolveDisputeInput,
  ip?: string,
) {
  if (!canResolveDisputes(user)) throw Errors.forbidden();
  const dispute = await loadDetail(id);
  if (!isActive(dispute.status)) throw Errors.conflict('This dispute is already closed');

  const parcelTotal = dispute.sellerOrder.subtotal + dispute.sellerOrder.deliveryFee;
  let refundAmount: bigint | null = null;
  if (input.outcome === 'RESOLVED' && REFUND_RESOLUTIONS.includes(input.resolution)) {
    refundAmount =
      input.refundAmount !== undefined
        ? BigInt(input.refundAmount)
        : input.resolution === 'FULL_REFUND'
          ? parcelTotal
          : null;
    if (refundAmount !== null && refundAmount > parcelTotal) {
      throw Errors.validation(`Refund cannot exceed the parcel total of ${parcelTotal} RWF`);
    }
  }

  const label = input.resolution.replace(/_/g, ' ').toLowerCase();
  const summary =
    input.outcome === 'REJECTED'
      ? `NeereMarket closed this dispute without action. ${input.note}`
      : `NeereMarket resolved this dispute: ${label}${refundAmount !== null ? ` (${refundAmount} RWF)` : ''}. ${input.note}`;

  await prisma.$transaction([
    prisma.dispute.update({
      where: { id },
      data: {
        status: input.outcome,
        resolution: input.resolution,
        resolutionNote: input.note,
        refundAmount,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
    }),
    prisma.disputeMessage.create({
      data: { disputeId: id, authorRole: 'SYSTEM', body: summary },
    }),
  ]);

  await writeAuditLog({
    actorId: user.id,
    action: 'dispute.resolve',
    entityType: 'Dispute',
    entityId: id,
    before: { status: dispute.status },
    after: {
      status: input.outcome,
      resolution: input.resolution,
      refundAmount: refundAmount === null ? null : String(refundAmount),
    },
    reason: input.note,
    ip,
  });

  const title =
    input.outcome === 'RESOLVED'
      ? `${dispute.disputeNumber} resolved`
      : `${dispute.disputeNumber} closed`;
  await Promise.all(
    [dispute.customerId, dispute.seller.userId].map((userId) =>
      notifyUser({
        userId,
        type: 'DISPUTE_RESOLVED',
        title,
        body: summary.slice(0, 200),
        data: { disputeId: id },
      }),
    ),
  );

  return getDispute(user, id);
}
