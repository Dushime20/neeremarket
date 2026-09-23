import type { Prisma } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';
import type { z } from 'zod';
import type { updateSellerProfileSchema } from '../validators/catalog.validator';
import { uniqueSlug } from '../shared/serialize';
import { getSellerProfileByUserId } from './catalog.service';

type UpdateSellerInput = z.infer<typeof updateSellerProfileSchema>;

async function uniqueStoreSlug(base: string, excludeStoreId?: string) {
  return uniqueSlug(base, async (candidate) => {
    const found = await prisma.store.findFirst({
      where: {
        slug: candidate,
        ...(excludeStoreId ? { NOT: { id: excludeStoreId } } : {}),
      },
      select: { id: true },
    });
    return !!found;
  });
}

export async function listStores(page = 1, limit = 24, district?: string) {
  const where = {
    isActive: true,
    deletedAt: null,
    ...(district
      ? { seller: { district: { equals: district, mode: 'insensitive' as const } } }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            businessName: true,
            verificationStatus: true,
            district: true,
            province: true,
            ratingAvg: true,
            ratingCount: true,
            totalOrders: true,
            logoUrl: true,
            coverUrl: true,
            marketLocation: true,
          },
        },
        _count: { select: { products: { where: { status: 'ACTIVE', deletedAt: null } } } },
        products: {
          where: { status: 'ACTIVE', deletedAt: null },
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    }),
    prisma.store.count({ where }),
  ]);

  return {
    items: items.map((store) => ({
      ...store,
      products: store.products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.images[0]?.url ?? null,
      })),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getStoreBySlug(slug: string) {
  const store = await prisma.store.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      seller: true,
      products: {
        where: { status: 'ACTIVE', deletedAt: null },
        take: 24,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!store) throw Errors.notFound('Store');

  const categoryRows = await prisma.product.findMany({
    where: { storeId: store.id, status: 'ACTIVE', deletedAt: null },
    distinct: ['categoryId'],
    select: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          sortOrder: true,
          parent: {
            select: { id: true, name: true, slug: true, sortOrder: true },
          },
        },
      },
    },
  });

  const parents = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      sortOrder: number;
      children: Array<{ id: string; name: string; slug: string; sortOrder: number }>;
    }
  >();

  for (const row of categoryRows) {
    const category = row.category;
    if (category.parent) {
      const parent = parents.get(category.parent.id) || {
        id: category.parent.id,
        name: category.parent.name,
        slug: category.parent.slug,
        sortOrder: category.parent.sortOrder,
        children: [],
      };
      if (!parent.children.some((child) => child.id === category.id)) {
        parent.children.push({
          id: category.id,
          name: category.name,
          slug: category.slug,
          sortOrder: category.sortOrder,
        });
      }
      parents.set(category.parent.id, parent);
    } else {
      if (!parents.has(category.id)) {
        parents.set(category.id, {
          id: category.id,
          name: category.name,
          slug: category.slug,
          sortOrder: category.sortOrder,
          children: [],
        });
      }
    }
  }

  const categories = [...parents.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      children: parent.children
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map(({ id, name, slug }) => ({ id, name, slug })),
    }));

  return {
    ...store,
    categories,
    products: store.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      discountPrice: p.discountPrice != null ? String(p.discountPrice) : null,
      currency: p.currency,
      ratingAvg: String(p.ratingAvg),
      ratingCount: p.ratingCount,
      images: p.images,
      category: p.category,
      store: {
        name: store.name,
        slug: store.slug,
        seller: {
          businessName: store.seller.businessName,
          verificationStatus: store.seller.verificationStatus,
          district: store.seller.district,
          ratingAvg: String(store.seller.ratingAvg),
        },
      },
    })),
  };
}

export async function updateMySellerProfile(userId: string, input: UpdateSellerInput) {
  const seller = await getSellerProfileByUserId(userId);
  if (!seller.store) throw Errors.notFound('Store');

  const nextName = input.businessName?.trim();
  const storeUpdate =
    nextName && nextName !== seller.store.name
      ? {
          name: nextName,
          slug: await uniqueStoreSlug(nextName, seller.store.id),
        }
      : nextName
        ? { name: nextName }
        : undefined;

  const updated = await prisma.sellerProfile.update({
    where: { id: seller.id },
    data: {
      ...input,
      store: storeUpdate ? { update: storeUpdate } : undefined,
    },
    include: { store: true },
  });

  return updated;
}

export async function getMySellerDashboard(userId: string) {
  const seller = await getSellerProfileByUserId(userId);
  if (!seller.store) throw Errors.notFound('Store');

  const [productCounts, orderCounts, lowStockRows] = await Promise.all([
    prisma.product.groupBy({
      by: ['status'],
      where: { storeId: seller.store.id, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.sellerOrder.groupBy({
      by: ['status'],
      where: { sellerId: seller.id },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM inventory i
      JOIN product_variants v ON v.id = i.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE p.store_id = ${seller.store.id}::uuid
        AND p.deleted_at IS NULL
        AND (i.quantity - i.reserved) <= i.low_stock_threshold
    `,
  ]);

  const lowStock = Number(lowStockRows[0]?.count ?? 0);

  return {
    seller: {
      id: seller.id,
      businessName: seller.businessName,
      verificationStatus: seller.verificationStatus,
      ratingAvg: seller.ratingAvg,
      ratingCount: seller.ratingCount,
      totalOrders: seller.totalOrders,
    },
    store: seller.store,
    wallet: seller.wallet
      ? {
          pendingBalance: String(seller.wallet.pendingBalance),
          availableBalance: String(seller.wallet.availableBalance),
          currency: seller.wallet.currency,
        }
      : null,
    products: Object.fromEntries(productCounts.map((c) => [c.status, c._count._all])),
    orders: Object.fromEntries(orderCounts.map((c) => [c.status, c._count._all])),
    lowStockProducts: lowStock,
  };
}

function metaFilled(meta: unknown) {
  if (!meta || typeof meta !== 'object') return false;
  return Object.values(meta as Record<string, unknown>).some((v) => String(v ?? '').trim().length > 0);
}

export async function getMyOnboarding(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      store: true,
      verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!seller) throw Errors.notFound('Seller profile');

  const verification = seller.verifications[0] || null;
  const steps = [
    {
      id: 'profile',
      title: 'Store profile',
      hint: 'Name, description, district, and phone',
      href: '/seller/profile',
      done: Boolean(
        seller.businessName && seller.description && seller.district && seller.businessPhone,
      ),
    },
    {
      id: 'branding',
      title: 'Store branding',
      hint: 'Logo and cover image',
      href: '/seller/profile',
      done: Boolean(seller.logoUrl && seller.coverUrl),
    },
    {
      id: 'identity',
      title: 'National ID',
      hint: 'ID number used for KYC',
      done: metaFilled(verification?.nationalIdMeta),
    },
    {
      id: 'business',
      title: 'Business & tax',
      hint: 'Registration and TIN details',
      done: metaFilled(verification?.businessRegMeta) && metaFilled(verification?.taxMeta),
    },
    {
      id: 'payout',
      title: 'Payout method',
      hint: 'MoMo or Airtel destination',
      done: metaFilled(verification?.payoutMeta),
    },
    {
      id: 'review',
      title: 'Submit for review',
      hint: 'Admin verifies your store',
      done: ['UNDER_REVIEW', 'VERIFIED'].includes(seller.verificationStatus),
    },
  ].map((step) =>
    seller.verificationStatus === 'VERIFIED' ? { ...step, done: true } : step,
  );

  return {
    verificationStatus: seller.verificationStatus,
    businessName: seller.businessName,
    verification,
    steps,
    progress: {
      completed: steps.filter((s) => s.done).length,
      total: steps.length,
    },
    canSubmit:
      steps.filter((s) => s.id !== 'review').every((s) => s.done) &&
      !['UNDER_REVIEW', 'VERIFIED'].includes(seller.verificationStatus),
  };
}

export async function saveMyOnboarding(
  userId: string,
  input: {
    nationalIdMeta?: Record<string, unknown>;
    businessRegMeta?: Record<string, unknown>;
    taxMeta?: Record<string, unknown>;
    payoutMeta?: Record<string, unknown>;
    submit?: boolean;
  },
) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { verifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!seller) throw Errors.notFound('Seller profile');
  if (seller.verificationStatus === 'VERIFIED') {
    throw Errors.conflict('Store is already verified');
  }
  if (seller.verificationStatus === 'SUSPENDED') {
    throw Errors.forbidden('Seller account is suspended');
  }

  let verification = seller.verifications[0];
  if (!verification) {
    verification = await prisma.sellerVerification.create({
      data: { sellerId: seller.id, status: 'PENDING' },
    });
  }

  verification = await prisma.sellerVerification.update({
    where: { id: verification.id },
    data: {
      ...(input.nationalIdMeta !== undefined
        ? { nationalIdMeta: input.nationalIdMeta as Prisma.InputJsonValue }
        : {}),
      ...(input.businessRegMeta !== undefined
        ? { businessRegMeta: input.businessRegMeta as Prisma.InputJsonValue }
        : {}),
      ...(input.taxMeta !== undefined ? { taxMeta: input.taxMeta as Prisma.InputJsonValue } : {}),
      ...(input.payoutMeta !== undefined
        ? { payoutMeta: input.payoutMeta as Prisma.InputJsonValue }
        : {}),
    },
  });

  if (input.submit) {
    const snapshot = await getMyOnboarding(userId);
    const missing = snapshot.steps.filter((s) => s.id !== 'review' && !s.done);
    if (missing.length) {
      throw Errors.validation(`Complete these steps first: ${missing.map((s) => s.title).join(', ')}`);
    }
    await prisma.$transaction([
      prisma.sellerVerification.update({
        where: { id: verification.id },
        data: { status: 'UNDER_REVIEW' },
      }),
      prisma.sellerProfile.update({
        where: { id: seller.id },
        data: { verificationStatus: 'UNDER_REVIEW' },
      }),
    ]);
  }

  return getMyOnboarding(userId);
}
