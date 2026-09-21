import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';

async function getOrCreateWishlist(userId: string) {
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wishlist.create({ data: { userId } });
}

export async function getWishlist(userId: string) {
  const wishlist = await getOrCreateWishlist(userId);
  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    orderBy: { createdAt: 'desc' },
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              store: {
                include: {
                  seller: {
                    select: {
                      businessName: true,
                      verificationStatus: true,
                      district: true,
                      ratingAvg: true,
                    },
                  },
                },
              },
              category: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  return {
    id: wishlist.id,
    items: items.map((item) => {
      const p = item.variant.product;
      const price = item.variant.price ?? p.discountPrice ?? p.price;
      return {
        id: item.id,
        variantId: item.variantId,
        addedAt: item.createdAt,
        product: {
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
            name: p.store.name,
            slug: p.store.slug,
            seller: {
              ...p.store.seller,
              ratingAvg: String(p.store.seller.ratingAvg),
            },
          },
        },
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          sku: item.variant.sku,
          attributes: item.variant.attributes,
          price: price != null ? String(price) : null,
          available: item.variant.inventory
            ? item.variant.inventory.quantity - item.variant.inventory.reserved
            : 0,
        },
      };
    }),
  };
}

export async function addWishlistItem(userId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { deletedAt: null } },
  });
  if (!variant) throw Errors.notFound('Product variant');

  const wishlist = await getOrCreateWishlist(userId);
  await prisma.wishlistItem.upsert({
    where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } },
    update: {},
    create: { wishlistId: wishlist.id, variantId },
  });

  return getWishlist(userId);
}

export async function removeWishlistItem(userId: string, variantId: string) {
  const wishlist = await getOrCreateWishlist(userId);
  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, variantId },
  });
  return getWishlist(userId);
}
