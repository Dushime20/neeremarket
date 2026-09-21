import type { CommissionRule, Prisma, PrismaClient } from '@prisma/client';

export type CommissionContext = {
  productId: string;
  categoryId: string;
  sellerId: string;
  promotionId?: string;
  lineTotal: bigint;
};

type Db = PrismaClient | Prisma.TransactionClient;

const SCOPE_RANK: Record<string, number> = {
  PRODUCT: 50,
  SELLER: 40,
  CATEGORY: 30,
  PROMOTION: 20,
  GLOBAL: 10,
};

export function calculateCommissionAmount(
  lineTotal: bigint,
  rateBps: number,
  fixedAmount?: bigint | null,
) {
  const pct = (lineTotal * BigInt(rateBps)) / 10000n;
  const fixed = fixedAmount ?? 0n;
  return pct + fixed;
}

export async function resolveCommissionRule(
  db: Db,
  ctx: CommissionContext,
): Promise<CommissionRule | null> {
  const now = new Date();
  const rules = await db.commissionRule.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
  });

  const matches = rules.filter((r) => {
    switch (r.scope) {
      case 'GLOBAL':
        return true;
      case 'PRODUCT':
        return r.scopeRefId === ctx.productId;
      case 'SELLER':
        return r.scopeRefId === ctx.sellerId;
      case 'CATEGORY':
        return r.scopeRefId === ctx.categoryId;
      case 'PROMOTION':
        return !!ctx.promotionId && r.scopeRefId === ctx.promotionId;
      default:
        return false;
    }
  });

  matches.sort((a, b) => {
    const rank = (SCOPE_RANK[b.scope] || 0) - (SCOPE_RANK[a.scope] || 0);
    if (rank !== 0) return rank;
    return b.priority - a.priority;
  });

  return matches[0] ?? null;
}
