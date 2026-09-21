import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';

async function hasVerifiedPurchase(customerId: string, productId?: string, sellerId?: string) {
  if (productId) {
    const item = await prisma.orderItem.findFirst({
      where: {
        variant: { productId },
        sellerOrder: {
          order: {
            customerId,
            status: { in: ['PAID', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'] },
          },
        },
      },
    });
    return !!item;
  }
  if (sellerId) {
    const so = await prisma.sellerOrder.findFirst({
      where: {
        sellerId,
        order: {
          customerId,
          status: { in: ['DELIVERED', 'COMPLETED', 'PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
      },
    });
    return !!so;
  }
  return false;
}

export async function createReview(
  customerId: string,
  input: {
    productId?: string;
    sellerId?: string;
    orderId?: string;
    rating: number;
    body?: string;
    images?: string[];
  },
) {
  const verified = await hasVerifiedPurchase(customerId, input.productId, input.sellerId);

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        customerId,
        productId: input.productId,
        sellerId: input.sellerId,
        orderId: input.orderId,
        rating: input.rating,
        body: input.body,
        isVerifiedPurchase: verified,
        images: {
          create: (input.images || []).map((url) => ({ url })),
        },
      },
      include: { images: true, customer: { select: { fullName: true } } },
    });

    if (input.productId) {
      const agg = await tx.review.aggregate({
        where: { productId: input.productId, deletedAt: null },
        _avg: { rating: true },
        _count: true,
      });
      await tx.product.update({
        where: { id: input.productId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count,
        },
      });
    }

    if (input.sellerId) {
      const agg = await tx.review.aggregate({
        where: { sellerId: input.sellerId, deletedAt: null },
        _avg: { rating: true },
        _count: true,
      });
      await tx.sellerProfile.update({
        where: { id: input.sellerId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count,
        },
      });
    }

    return created;
  });

  return review;
}

export async function listProductReviews(productId: string, page = 1, limit = 20) {
  const where = { productId, deletedAt: null };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        customer: { select: { fullName: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function markReviewHelpful(reviewId: string, helpful: boolean) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, deletedAt: null },
  });
  if (!review) throw Errors.notFound('Review');

  return prisma.review.update({
    where: { id: reviewId },
    data: { helpfulCount: { increment: helpful ? 1 : -1 } },
  });
}

export async function listSellerReviews(
  userId: string,
  scope: 'all' | 'product' | 'store' = 'all',
  page = 1,
  limit = 20,
) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { store: true },
  });
  if (!seller?.store) throw Errors.notFound('Seller profile');

  const storeId = seller.store.id;
  const where =
    scope === 'store'
      ? { sellerId: seller.id, productId: null, deletedAt: null }
      : scope === 'product'
        ? { product: { storeId }, deletedAt: null }
        : {
            deletedAt: null,
            OR: [{ sellerId: seller.id }, { product: { storeId } }],
          };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        customer: { select: { fullName: true, avatarUrl: true } },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const [productCount, storeCount] = await Promise.all([
    prisma.review.count({
      where: { product: { storeId }, deletedAt: null },
    }),
    prisma.review.count({
      where: { sellerId: seller.id, productId: null, deletedAt: null },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      target: item.productId ? 'product' : 'store',
    })),
    summary: {
      product: productCount,
      store: storeCount,
      total: productCount + storeCount,
    },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}
