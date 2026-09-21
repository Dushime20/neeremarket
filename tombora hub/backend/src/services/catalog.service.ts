import { Prisma, type ProductStatus } from '@prisma/client';
import { prisma } from '../shared/prisma';
import { toPlainProduct, uniqueSlug } from '../shared/serialize';
import { Errors } from '../shared/errors';
import type { z } from 'zod';
import type {
  createProductSchema,
  inventoryListQuerySchema,
  productListQuerySchema,
  updateProductSchema,
} from '../validators/catalog.validator';
import { env } from '../config/env';
import { syncProductStockStatus } from './inventory.service';

type ListQuery = z.infer<typeof productListQuerySchema>;
type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

const productCardInclude = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
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
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  },
  brand: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

function buildOrderBy(sort: ListQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }];
    case 'best_rated':
      return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
    case 'best_selling':
      return [{ salesCount: 'desc' }];
    case 'popular':
      return [{ viewCount: 'desc' }];
    case 'discount':
      return [{ discountPrice: 'asc' }, { createdAt: 'desc' }];
    case 'relevance':
    case 'newest':
    default:
      return [{ createdAt: 'desc' }];
  }
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      parent: true,
    },
  });
  if (!category) throw Errors.notFound('Category');
  return category;
}

export async function listProducts(query: ListQuery, opts?: { status?: ProductStatus }) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: opts?.status ?? 'ACTIVE',
  };

  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { parent: { slug: query.category } }],
    };
  }
  if (query.brand) {
    where.brand = { slug: query.brand };
  }
  if (query.seller || query.district) {
    where.store = {
      ...(query.seller ? { slug: query.seller } : {}),
      ...(query.district
        ? { seller: { district: { equals: query.district, mode: 'insensitive' } } }
        : {}),
    };
  }
  if (query.condition) where.condition = query.condition;
  if (query.minPrice != null || query.maxPrice != null) {
    where.price = {
      ...(query.minPrice != null ? { gte: BigInt(query.minPrice) } : {}),
      ...(query.maxPrice != null ? { lte: BigInt(query.maxPrice) } : {}),
    };
  }
  if (query.q) {
    const q = query.q.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { tags: { has: q.toLowerCase() } },
      { brand: { name: { contains: q, mode: 'insensitive' } } },
      { store: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (query.inStock) {
    where.variants = {
      some: { isActive: true, inventory: { quantity: { gt: 0 } } },
    };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: buildOrderBy(query.sort),
      include: productCardInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p) => toPlainProduct(p as unknown as Record<string, unknown>)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: 'ACTIVE' },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      videos: { orderBy: { sortOrder: 'asc' } },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
      },
      store: {
        include: {
          seller: {
            select: {
              id: true,
              businessName: true,
              verificationStatus: true,
              district: true,
              province: true,
              ratingAvg: true,
              ratingCount: true,
              totalOrders: true,
            },
          },
        },
      },
      category: {
        include: { parent: { select: { id: true, name: true, slug: true } } },
      },
      brand: true,
    },
  });

  if (!product) throw Errors.notFound('Product');

  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    ...toPlainProduct(product as unknown as Record<string, unknown>),
    specifications: asSpecifications(product.specifications),
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price != null ? String(v.price) : null,
      inventory: v.inventory
        ? {
            ...v.inventory,
            available: v.inventory.quantity - v.inventory.reserved,
          }
        : null,
    })),
  };
}

export async function getSellerProfileByUserId(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { store: true, wallet: true },
  });
  if (!seller) throw Errors.notFound('Seller profile');
  return seller;
}

export async function listSellerProducts(
  userId: string,
  query: ListQuery & { status?: ProductStatus },
) {
  const seller = await getSellerProfileByUserId(userId);
  if (!seller.store) throw Errors.notFound('Store');

  const where: Prisma.ProductWhereInput = {
    storeId: seller.store.id,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
  };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { sku: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: {
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  },
        variants: { include: { inventory: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((p) => ({
      ...toPlainProduct(p as unknown as Record<string, unknown>),
      variants: p.variants.map((v) => ({
        ...v,
        price: v.price != null ? String(v.price) : null,
        inventory: v.inventory
          ? {
              ...v.inventory,
              available: v.inventory.quantity - v.inventory.reserved,
            }
          : null,
      })),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

function asAttributes(value: Prisma.JsonValue): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, String(val ?? '')]),
  );
}

export function asSpecifications(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
      const name = String((row as Record<string, unknown>).name ?? '').trim();
      const specValue = String((row as Record<string, unknown>).value ?? '').trim();
      if (!name || !specValue) return null;
      return { name, value: specValue };
    })
    .filter((row): row is { name: string; value: string } => Boolean(row));
}

function mapSellerProduct(product: {
  specifications?: Prisma.JsonValue | null;
  variants: Array<{
    price: bigint | null;
    inventory: {
      quantity: number;
      reserved: number;
      lowStockThreshold: number;
    } | null;
  } & Record<string, unknown>>;
} & Record<string, unknown>) {
  return {
    ...toPlainProduct(product),
    specifications: asSpecifications(product.specifications),
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price != null ? String(v.price) : null,
      inventory: v.inventory
        ? {
            ...v.inventory,
            available: v.inventory.quantity - v.inventory.reserved,
          }
        : null,
    })),
  };
}

export async function listSellerInventory(userId: string, query: InventoryListQuery) {
  const seller = await getSellerProfileByUserId(userId);
  if (!seller.store) throw Errors.notFound('Store');

  const storeId = seller.store.id;
  const q = query.q?.trim() || null;
  const qLike = q ? `%${q}%` : null;
  const skip = (query.page - 1) * query.limit;

  type StockRow = {
    id: string;
    sku: string;
    name: string | null;
    attributes: Prisma.JsonValue;
    quantity: number;
    reserved: number;
    low_stock_threshold: number;
    product_id: string;
    product_name: string;
    product_slug: string;
    product_status: string;
    product_image: string | null;
  };

  const stockSql =
    query.stock === 'out'
      ? Prisma.sql`AND (i.quantity - i.reserved) <= 0`
      : query.stock === 'low'
        ? Prisma.sql`AND (i.quantity - i.reserved) > 0 AND (i.quantity - i.reserved) <= i.low_stock_threshold`
        : query.stock === 'in'
          ? Prisma.sql`AND (i.quantity - i.reserved) > i.low_stock_threshold`
          : Prisma.empty;

  const searchSql = qLike
    ? Prisma.sql`AND (
        p.name ILIKE ${qLike}
        OR v.sku ILIKE ${qLike}
        OR v.name ILIKE ${qLike}
        OR v.attributes::text ILIKE ${qLike}
      )`
    : Prisma.empty;

  const [summaryRows, totalRows, items] = await Promise.all([
    prisma.$queryRaw<Array<{ variants: bigint; in_stock: bigint; low_stock: bigint; out_of_stock: bigint }>>`
      SELECT
        COUNT(*)::bigint AS variants,
        COUNT(*) FILTER (
          WHERE (i.quantity - i.reserved) > i.low_stock_threshold
        )::bigint AS in_stock,
        COUNT(*) FILTER (
          WHERE (i.quantity - i.reserved) > 0
            AND (i.quantity - i.reserved) <= i.low_stock_threshold
        )::bigint AS low_stock,
        COUNT(*) FILTER (
          WHERE (i.quantity - i.reserved) <= 0
        )::bigint AS out_of_stock
      FROM product_variants v
      JOIN inventory i ON i.variant_id = v.id
      JOIN products p ON p.id = v.product_id
      WHERE p.store_id = ${storeId}::uuid
        AND p.deleted_at IS NULL
    `,
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM product_variants v
      JOIN inventory i ON i.variant_id = v.id
      JOIN products p ON p.id = v.product_id
      WHERE p.store_id = ${storeId}::uuid
        AND p.deleted_at IS NULL
        ${stockSql}
        ${searchSql}
    `,
    prisma.$queryRaw<StockRow[]>`
      SELECT
        v.id,
        v.sku,
        v.name,
        v.attributes,
        i.quantity,
        i.reserved,
        i.low_stock_threshold,
        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.status AS product_status,
        (
          SELECT pi.url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS product_image
      FROM product_variants v
      JOIN inventory i ON i.variant_id = v.id
      JOIN products p ON p.id = v.product_id
      WHERE p.store_id = ${storeId}::uuid
        AND p.deleted_at IS NULL
        ${stockSql}
        ${searchSql}
      ORDER BY v.updated_at DESC
      LIMIT ${query.limit}
      OFFSET ${skip}
    `,
  ]);

  const summaryRow = summaryRows[0];
  const total = Number(totalRows[0]?.total ?? 0);

  return {
    items: items.map((row) => {
      const available = row.quantity - row.reserved;
      const threshold = row.low_stock_threshold;
      return {
        id: row.id,
        sku: row.sku,
        name: row.name,
        attributes: asAttributes(row.attributes),
        quantity: row.quantity,
        reserved: row.reserved,
        available,
        lowStockThreshold: threshold,
        isOut: available <= 0,
        isLow: available > 0 && available <= threshold,
        product: {
          id: row.product_id,
          name: row.product_name,
          slug: row.product_slug,
          status: row.product_status,
          image: row.product_image,
        },
      };
    }),
    summary: {
      variants: Number(summaryRow?.variants ?? 0),
      inStock: Number(summaryRow?.in_stock ?? 0),
      lowStock: Number(summaryRow?.low_stock ?? 0),
      outOfStock: Number(summaryRow?.out_of_stock ?? 0),
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

async function requireAssignableCategory(categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, isActive: true },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { children: { where: { isActive: true } } } },
    },
  });
  if (!category) throw Errors.notFound('Category');
  if (category._count.children > 0) {
    throw Errors.validation(
      'Select a subcategory. Products must be listed under a specific subcategory.',
    );
  }
  return category;
}

export async function createSellerProduct(userId: string, input: CreateProductInput) {
  const seller = await getSellerProfileByUserId(userId);
  if (!seller.store) throw Errors.notFound('Store');
  if (seller.verificationStatus === 'SUSPENDED') {
    throw Errors.forbidden('Seller account is suspended');
  }

  await requireAssignableCategory(input.categoryId);

  const autoApprove = await prisma.setting.findUnique({ where: { key: 'product_auto_approve' } });
  const shouldAuto =
    autoApprove?.value === true ||
    (typeof autoApprove?.value === 'boolean' && autoApprove.value);

  const status: ProductStatus = input.submitForApproval
    ? shouldAuto
      ? 'ACTIVE'
      : 'PENDING_APPROVAL'
    : 'DRAFT';

  const slug = await uniqueSlug(input.name, async (s) => {
    const found = await prisma.product.findUnique({ where: { slug: s } });
    return !!found;
  });

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        storeId: seller.store!.id,
        categoryId: input.categoryId,
        brandId: input.brandId,
        name: input.name,
        slug,
        sku: input.sku,
        description: input.description,
        shortDescription: input.shortDescription,
        price: BigInt(input.price),
        discountPrice: input.discountPrice != null ? BigInt(input.discountPrice) : null,
        currency: input.currency || env.DEFAULT_CURRENCY,
        condition: input.condition,
        weightGrams: input.weightGrams,
        lengthMm: input.lengthMm,
        widthMm: input.widthMm,
        heightMm: input.heightMm,
        tags: input.tags,
        specifications: input.specifications as Prisma.InputJsonValue,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        status,
        images: {
          create: input.images.map((img, index) => ({
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary ?? index === 0,
            sortOrder: index,
          })),
        },
        videos: {
          create: input.videos.map((video, index) => ({
            url: video.url,
            sortOrder: index,
          })),
        },
      },
    });

    for (const variant of input.variants) {
      const skuTaken = await tx.productVariant.findUnique({ where: { sku: variant.sku } });
      if (skuTaken) throw Errors.conflict(`SKU already exists: ${variant.sku}`);

      await tx.productVariant.create({
        data: {
          productId: created.id,
          sku: variant.sku,
          name: variant.name,
          attributes: variant.attributes,
          price: variant.price != null ? BigInt(variant.price) : null,
          weightGrams: variant.weightGrams,
          imageUrl: variant.imageUrl,
          inventory: {
            create: {
              quantity: variant.stock,
              reserved: 0,
              lowStockThreshold: variant.lowStockThreshold,
            },
          },
        },
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        videos: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
        category: {
          include: { parent: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
  });

  return mapSellerProduct(product as never);
}

export async function getSellerProduct(userId: string, productId: string) {
  const seller = await getSellerProfileByUserId(userId);
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: seller.store?.id, deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      videos: { orderBy: { sortOrder: 'asc' } },
      variants: { include: { inventory: true } },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      brand: { select: { name: true, slug: true } },
    },
  });
  if (!product) throw Errors.notFound('Product');
  return mapSellerProduct(product as never);
}

export async function updateSellerProduct(
  userId: string,
  productId: string,
  input: UpdateProductInput,
) {
  const seller = await getSellerProfileByUserId(userId);
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: seller.store?.id, deletedAt: null },
  });
  if (!product) throw Errors.notFound('Product');

  if (input.categoryId) {
    await requireAssignableCategory(input.categoryId);
  }

  const autoApprove = await prisma.setting.findUnique({ where: { key: 'product_auto_approve' } });
  const shouldAuto =
    autoApprove?.value === true ||
    (typeof autoApprove?.value === 'boolean' && autoApprove.value);

  let nextStatus: ProductStatus | undefined;
  if (input.unpublish) {
    if (!['ACTIVE', 'OUT_OF_STOCK'].includes(product.status)) {
      throw Errors.conflict('Only live listings can be removed from the market');
    }
    nextStatus = 'ARCHIVED';
  } else if (input.relist) {
    if (product.status !== 'ARCHIVED' && product.status !== 'DRAFT' && product.status !== 'REJECTED') {
      throw Errors.conflict('This listing is already on the market or in review');
    }
    nextStatus = shouldAuto ? 'ACTIVE' : 'PENDING_APPROVAL';
  } else if (input.submitForApproval === true && ['DRAFT', 'REJECTED', 'ARCHIVED'].includes(product.status)) {
    nextStatus = shouldAuto ? 'ACTIVE' : 'PENDING_APPROVAL';
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (input.images.length) {
        await tx.productImage.createMany({
          data: input.images.map((img, index) => ({
            productId: product.id,
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary ?? index === 0,
            sortOrder: index,
          })),
        });
      }
    }

    if (input.videos) {
      await tx.productVideo.deleteMany({ where: { productId: product.id } });
      if (input.videos.length) {
        await tx.productVideo.createMany({
          data: input.videos.map((video, index) => ({
            productId: product.id,
            url: video.url,
            sortOrder: index,
          })),
        });
      }
    }

    return tx.product.update({
      where: { id: product.id },
      data: {
        name: input.name,
        sku: input.sku === undefined ? undefined : input.sku,
        description: input.description === undefined ? undefined : input.description,
        shortDescription: input.shortDescription === undefined ? undefined : input.shortDescription,
        categoryId: input.categoryId,
        brandId: input.brandId === undefined ? undefined : input.brandId,
        price: input.price != null ? BigInt(input.price) : undefined,
        discountPrice:
          input.discountPrice === undefined
            ? undefined
            : input.discountPrice == null
              ? null
              : BigInt(input.discountPrice),
        condition: input.condition,
        weightGrams: input.weightGrams === undefined ? undefined : input.weightGrams,
        lengthMm: input.lengthMm === undefined ? undefined : input.lengthMm,
        widthMm: input.widthMm === undefined ? undefined : input.widthMm,
        heightMm: input.heightMm === undefined ? undefined : input.heightMm,
        tags: input.tags,
        specifications:
          input.specifications === undefined
            ? undefined
            : (input.specifications as Prisma.InputJsonValue),
        seoTitle: input.seoTitle === undefined ? undefined : input.seoTitle,
        seoDescription: input.seoDescription === undefined ? undefined : input.seoDescription,
        status: nextStatus,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        videos: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
        category: {
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  },
      },
    });
  });

  return mapSellerProduct(updated as never);
}

export async function deleteSellerProduct(userId: string, productId: string) {
  const seller = await getSellerProfileByUserId(userId);
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: seller.store?.id, deletedAt: null },
  });
  if (!product) throw Errors.notFound('Product');

  await prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });

  return { id: product.id, deleted: true };
}

export async function adjustVariantStock(
  userId: string,
  variantId: string,
  input: { quantity?: number; setQuantity?: number; reason?: string },
) {
  const seller = await getSellerProfileByUserId(userId);

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findFirst({
      where: {
        id: variantId,
        product: { storeId: seller.store?.id, deletedAt: null },
      },
      include: { inventory: true },
    });
    if (!variant?.inventory) throw Errors.notFound('Inventory');

    const inventory = await tx.inventory.findUniqueOrThrow({
      where: { id: variant.inventory.id },
    });

    const delta =
      input.setQuantity != null ? input.setQuantity - inventory.quantity : (input.quantity ?? 0);
    const nextQty = inventory.quantity + delta;
    if (nextQty < 0 || nextQty < inventory.reserved) {
      throw Errors.insufficientStock();
    }

    const updated = await tx.inventory.update({
      where: { id: inventory.id },
      data: { quantity: nextQty },
    });

    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        type: 'ADJUSTMENT',
        delta,
        reason: input.reason || (input.setQuantity != null ? 'Set on-hand quantity' : 'Manual adjustment'),
        actorId: userId,
      },
    });

    await syncProductStockStatus(tx, variant.productId);

    return {
      ...updated,
      available: updated.quantity - updated.reserved,
    };
  });
}
