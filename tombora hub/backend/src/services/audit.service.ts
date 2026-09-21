import { prisma } from '../shared/prisma';

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ip?: string;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId || undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || undefined,
      before: input.before as object | undefined,
      after: input.after as object | undefined,
      reason: input.reason,
      ip: input.ip,
    },
  });
}

export async function listAuditLogs(page = 1, limit = 30) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}
