import { z } from 'zod';

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
  category: z.string().optional(),
  brand: z.string().optional(),
  seller: z.string().optional(),
  district: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  condition: z.enum(['NEW', 'USED', 'REFURBISHED']).optional(),
  sort: z
    .enum([
      'relevance',
      'newest',
      'price_asc',
      'price_desc',
      'best_rated',
      'best_selling',
      'popular',
      'discount',
    ])
    .default('newest'),
  q: z.string().optional(),
  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const searchQuerySchema = productListQuerySchema;

const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(160).optional(),
  isPrimary: z.boolean().optional(),
});

const productVideoSchema = z.object({
  url: z.string().url(),
});

const productSpecSchema = z.object({
  name: z.string().min(1).max(80),
  value: z.string().min(1).max(240),
});

const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(1).max(64),
  name: z.string().max(160).optional(),
  attributes: z.record(z.string().min(1).max(80)).superRefine((attrs, ctx) => {
    const keys = Object.keys(attrs);
    if (!keys.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Each stock line needs at least one attribute' });
    }
    if (keys.length > 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A stock line can have at most 8 attributes' });
    }
    for (const key of keys) {
      if (!key.trim() || key.trim().length > 40) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Attribute names must be 1–40 characters' });
      }
    }
  }),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  weightGrams: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().max(64).optional(),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  price: z.number().int().positive(),
  discountPrice: z.number().int().positive().optional(),
  currency: z.string().default('RWF'),
  condition: z.enum(['NEW', 'USED', 'REFURBISHED']).default('NEW'),
  weightGrams: z.number().int().positive().optional(),
  lengthMm: z.number().int().positive().optional(),
  widthMm: z.number().int().positive().optional(),
  heightMm: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  specifications: z.array(productSpecSchema).max(40).default([]),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  images: z.array(productImageSchema).max(12).default([]),
  videos: z.array(productVideoSchema).max(6).default([]),
  variants: z.array(productVariantSchema).min(1).max(80),
  submitForApproval: z.boolean().default(false),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  sku: z.string().max(64).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().nullable().optional(),
  price: z.number().int().positive().optional(),
  discountPrice: z.number().int().positive().nullable().optional(),
  currency: z.string().optional(),
  condition: z.enum(['NEW', 'USED', 'REFURBISHED']).optional(),
  weightGrams: z.number().int().positive().nullable().optional(),
  lengthMm: z.number().int().positive().nullable().optional(),
  widthMm: z.number().int().positive().nullable().optional(),
  heightMm: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).optional(),
  specifications: z.array(productSpecSchema).max(40).optional(),
  seoTitle: z.string().max(160).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
  images: z.array(productImageSchema).max(12).optional(),
  videos: z.array(productVideoSchema).max(6).optional(),
  submitForApproval: z.boolean().optional(),
  unpublish: z.boolean().optional(),
  relist: z.boolean().optional(),
  variants: z.array(productVariantSchema).min(1).max(80).optional(),
});

export const sellerReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  scope: z.enum(['all', 'product', 'store']).default('all'),
});

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().optional(),
  stock: z.enum(['all', 'in', 'low', 'out', 'off']).default('all'),
});

export const adjustInventorySchema = z
  .object({
    quantity: z.number().int().optional(),
    setQuantity: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    reason: z.string().min(2).max(255).optional(),
  })
  .refine((d) => d.quantity != null || d.setQuantity != null || d.isAvailable != null, {
    message: 'Provide quantity, setQuantity, or isAvailable',
  });

export const updateSellerProfileSchema = z.object({
  businessName: z.string().min(2).max(160).optional(),
  description: z.string().max(5000).optional(),
  businessCategory: z.string().max(120).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  cell: z.string().optional(),
  village: z.string().optional(),
  marketLocation: z.string().optional(),
  shopLocation: z.string().optional(),
  businessPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  logoUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
});

const metaObject = z.record(z.unknown()).optional();

export const sellerOnboardingSchema = z.object({
  nationalIdMeta: metaObject,
  businessRegMeta: metaObject,
  taxMeta: metaObject,
  payoutMeta: metaObject,
  submit: z.boolean().optional(),
});
