import type { ProductStatus, VerificationStatus, UserStatus } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import { writeAuditLog } from './audit.service';

export async function getDashboard() {
  const [
    users,
    sellers,
    products,
    orders,
    pendingSellers,
    pendingProducts,
    openPayouts,
    openReturns,
    gmv,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.sellerProfile.count(),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.sellerProfile.count({ where: { verificationStatus: 'UNDER_REVIEW' } }),
    prisma.product.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } }),
    prisma.payoutRequest.count({ where: { status: { in: ['REQUESTED', 'UNDER_REVIEW', 'APPROVED'] } } }),
    prisma.returnRequest.count({ where: { status: { in: ['REQUESTED', 'UNDER_REVIEW'] } } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] } },
      _sum: { total: true },
    }),
  ]);

  return {
    counts: {
      users,
      sellers,
      products,
      orders,
      pendingSellers,
      pendingProducts,
      openPayouts,
      openReturns,
    },
    gmv: String(gmv._sum.total ?? 0n),
    currency: 'RWF',
  };
}

export async function listUsers(page = 1, limit = 20, q?: string) {
  const skip = (page - 1) * limit;
  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { fullName: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        status: true,
        createdAt: true,
        roles: { include: { role: { select: { code: true } } } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map((u) => ({
      ...u,
      roles: u.roles.map((r) => r.role.code),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function updateUserStatus(
  actorId: string,
  userId: string,
  status: UserStatus,
  ip?: string,
) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw Errors.notFound('User');
  if (userId === actorId) throw Errors.validation('Cannot change your own status');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  await writeAuditLog({
    actorId,
    action: 'user.status_update',
    entityType: 'User',
    entityId: userId,
    before: { status: user.status },
    after: { status },
    ip,
  });

  return updated;
}

export async function listSellers(page = 1, limit = 20, status?: VerificationStatus) {
  const skip = (page - 1) * limit;
  const where = status ? { verificationStatus: status } : {};
  const [items, total] = await Promise.all([
    prisma.sellerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.sellerProfile.count({ where }),
  ]);
  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function moderateSeller(
  actorId: string,
  sellerId: string,
  verificationStatus: VerificationStatus,
  reason?: string,
  ip?: string,
) {
  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
  if (!seller) throw Errors.notFound('Seller');

  const updated = await prisma.sellerProfile.update({
    where: { id: sellerId },
    data: { verificationStatus },
  });

  await writeAuditLog({
    actorId,
    action: 'seller.moderate',
    entityType: 'SellerProfile',
    entityId: sellerId,
    before: { verificationStatus: seller.verificationStatus },
    after: { verificationStatus },
    reason,
    ip,
  });

  return updated;
}

export async function listProducts(page = 1, limit = 20, status?: ProductStatus) {
  const skip = (page - 1) * limit;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        price: true,
        currency: true,
        createdAt: true,
        store: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p) => ({ ...p, price: String(p.price) })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function moderateProduct(
  actorId: string,
  productId: string,
  status: ProductStatus,
  reason?: string,
  ip?: string,
) {
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw Errors.notFound('Product');

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status },
  });

  await writeAuditLog({
    actorId,
    action: 'product.moderate',
    entityType: 'Product',
    entityId: productId,
    before: { status: product.status },
    after: { status },
    reason,
    ip,
  });

  return { ...updated, price: String(updated.price) };
}

export async function listOrders(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        customer: { select: { fullName: true, email: true } },
      },
    }),
    prisma.order.count(),
  ]);
  return {
    items: items.map((o) => ({ ...o, total: String(o.total) })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function listBanners(activeOnly = false) {
  const now = new Date();
  return prisma.cmsBanner.findMany({
    where: activeOnly
      ? {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        }
      : undefined,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function upsertBanner(
  actorId: string,
  input: {
    id?: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  },
  ip?: string,
) {
  const banner = input.id
    ? await prisma.cmsBanner.update({
        where: { id: input.id },
        data: {
          title: input.title,
          subtitle: input.subtitle,
          imageUrl: input.imageUrl,
          linkUrl: input.linkUrl,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      })
    : await prisma.cmsBanner.create({
        data: {
          title: input.title,
          subtitle: input.subtitle,
          imageUrl: input.imageUrl,
          linkUrl: input.linkUrl,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      });

  await writeAuditLog({
    actorId,
    action: input.id ? 'cms.banner_update' : 'cms.banner_create',
    entityType: 'CmsBanner',
    entityId: banner.id,
    after: banner,
    ip,
  });

  return banner;
}

export async function listPages() {
  return prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
}

export async function upsertPage(
  actorId: string,
  input: {
    id?: string;
    slug: string;
    title: string;
    body: string;
    isPublished?: boolean;
  },
  ip?: string,
) {
  const page = input.id
    ? await prisma.cmsPage.update({
        where: { id: input.id },
        data: {
          slug: input.slug,
          title: input.title,
          body: input.body,
          isPublished: input.isPublished ?? false,
        },
      })
    : await prisma.cmsPage.create({
        data: {
          slug: input.slug,
          title: input.title,
          body: input.body,
          isPublished: input.isPublished ?? false,
        },
      });

  await writeAuditLog({
    actorId,
    action: input.id ? 'cms.page_update' : 'cms.page_create',
    entityType: 'CmsPage',
    entityId: page.id,
    after: { slug: page.slug, isPublished: page.isPublished },
    ip,
  });

  return page;
}

export async function getPublishedPage(slug: string) {
  const page = await prisma.cmsPage.findFirst({ where: { slug, isPublished: true } });
  if (!page) throw Errors.notFound('Page');
  return page;
}

export async function listSettings() {
  return prisma.setting.findMany({ orderBy: { key: 'asc' } });
}

export async function upsertSetting(actorId: string, key: string, value: unknown, ip?: string) {
  const existing = await prisma.setting.findUnique({ where: { key } });
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value: value as object },
    create: { key, value: value as object },
  });

  await writeAuditLog({
    actorId,
    action: 'settings.update',
    entityType: 'Setting',
    entityId: setting.id,
    before: existing ? { key, value: existing.value } : undefined,
    after: { key, value },
    ip,
  });

  return setting;
}
