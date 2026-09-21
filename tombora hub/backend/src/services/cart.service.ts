import { prisma } from '../shared/prisma';
import { Errors } from '../shared/errors';

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
              store: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      businessName: true,
                      verificationStatus: true,
                      district: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function serializeCart(cart: Awaited<ReturnType<typeof loadCartById>>) {
  if (!cart) return null;

  const groups = new Map<
    string,
    {
      sellerId: string;
      storeName: string;
      storeSlug: string;
      items: unknown[];
      subtotal: bigint;
    }
  >();

  let subtotal = 0n;

  for (const item of cart.items) {
    const product = item.variant.product;
    const unitPrice = item.variant.price ?? product.discountPrice ?? product.price;
    const lineTotal = unitPrice * BigInt(item.quantity);
    subtotal += lineTotal;

    const sellerId = product.store.seller.id;
    if (!groups.has(sellerId)) {
      groups.set(sellerId, {
        sellerId,
        storeName: product.store.name,
        storeSlug: product.store.slug,
        items: [],
        subtotal: 0n,
      });
    }
    const group = groups.get(sellerId)!;
    group.subtotal += lineTotal;
    group.items.push({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variantId,
      sku: item.variant.sku,
      variantName: item.variant.name,
      attributes: item.variant.attributes,
      available: item.variant.inventory
        ? item.variant.inventory.quantity - item.variant.inventory.reserved
        : 0,
      unitPrice: String(unitPrice),
      lineTotal: String(lineTotal),
      currency: product.currency,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url ?? null,
        status: product.status,
      },
      store: {
        name: product.store.name,
        slug: product.store.slug,
        seller: product.store.seller,
      },
    });
  }

  return {
    id: cart.id,
    itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
    subtotal: String(subtotal),
    currency: 'RWF',
    sellerGroups: [...groups.values()].map((g) => ({
      ...g,
      subtotal: String(g.subtotal),
    })),
    items: cart.items.map((item) => {
      const product = item.variant.product;
      const unitPrice = item.variant.price ?? product.discountPrice ?? product.price;
      return {
        id: item.id,
        quantity: item.quantity,
        variantId: item.variantId,
        unitPrice: String(unitPrice),
        lineTotal: String(unitPrice * BigInt(item.quantity)),
        productName: product.name,
        productSlug: product.slug,
        variantName: item.variant.name,
        attributes: item.variant.attributes,
        available: item.variant.inventory
          ? item.variant.inventory.quantity - item.variant.inventory.reserved
          : 0,
        image: product.images[0]?.url ?? null,
        storeName: product.store.name,
        storeSlug: product.store.slug,
      };
    }),
  };
}

async function loadCartById(cartId: string) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
}

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findFirst({
    where: { userId },
    include: cartInclude,
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return serializeCart(cart);
}

export async function addCartItem(userId: string, variantId: string, quantity: number) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      isActive: true,
      product: { status: 'ACTIVE', deletedAt: null },
    },
    include: { inventory: true },
  });
  if (!variant) throw Errors.notFound('Product variant');

  const available = variant.inventory
    ? variant.inventory.quantity - variant.inventory.reserved
    : 0;
  if (available < quantity) throw Errors.insufficientStock();

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.variantId === variantId);
  const nextQty = (existing?.quantity || 0) + quantity;
  if (available < nextQty) throw Errors.insufficientStock();

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity },
    });
  }

  return getCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw Errors.notFound('Cart item');

  const available = item.variant.inventory
    ? item.variant.inventory.quantity - item.variant.inventory.reserved
    : 0;
  if (available < quantity) throw Errors.insufficientStock();

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw Errors.notFound('Cart item');

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findFirst({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return getCart(userId);
}
