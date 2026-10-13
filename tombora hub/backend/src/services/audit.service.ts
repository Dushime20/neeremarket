import type { Prisma } from '@prisma/client';
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

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  search?: string;
  actorId?: string;
}

export async function listAuditLogs(params: ListAuditLogsParams | number = 1) {
  const options: ListAuditLogsParams = typeof params === 'number' ? { page: params, limit: 30 } : params;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 30));
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {
    ...(options.action ? { action: { contains: options.action, mode: 'insensitive' } } : {}),
    ...(options.entityType ? { entityType: options.entityType } : {}),
    ...(options.actorId ? { actorId: options.actorId } : {}),
    ...(options.search
      ? {
          OR: [
            { action: { contains: options.search, mode: 'insensitive' } },
            { entityType: { contains: options.search, mode: 'insensitive' } },
            { entityId: { contains: options.search, mode: 'insensitive' } },
            { reason: { contains: options.search, mode: 'insensitive' } },
            { ip: { contains: options.search, mode: 'insensitive' } },
            { actor: { fullName: { contains: options.search, mode: 'insensitive' } } },
            { actor: { email: { contains: options.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export interface ListLoginHistoryParams {
  page?: number;
  limit?: number;
  userId?: string;
  success?: boolean;
  search?: string;
}

export async function listLoginHistory(params: ListLoginHistoryParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 30));
  const skip = (page - 1) * limit;

  const where: Prisma.LoginHistoryWhereInput = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(typeof params.success === 'boolean' ? { success: params.success } : {}),
    ...(params.search
      ? {
          OR: [
            { ip: { contains: params.search, mode: 'insensitive' } },
            { userAgent: { contains: params.search, mode: 'insensitive' } },
            { user: { fullName: { contains: params.search, mode: 'insensitive' } } },
            { user: { email: { contains: params.search, mode: 'insensitive' } } },
            { user: { phone: { contains: params.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.loginHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.loginHistory.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getAuditStats() {
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalAuditLogs,
    auditLogsPast24h,
    totalLogins,
    failedLoginsPast24h,
    successfulLoginsPast24h,
    payoutAuditsCount,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: past24h } } }),
    prisma.loginHistory.count(),
    prisma.loginHistory.count({ where: { success: false, createdAt: { gte: past24h } } }),
    prisma.loginHistory.count({ where: { success: true, createdAt: { gte: past24h } } }),
    prisma.auditLog.count({ where: { entityType: 'PayoutRequest' } }),
  ]);

  return {
    totalAuditLogs,
    auditLogsPast24h,
    totalLogins,
    failedLoginsPast24h,
    successfulLoginsPast24h,
    payoutAuditsCount,
  };
}
