import { z } from 'zod';

export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
});

export const sellerModerateSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED']),
  reason: z.string().max(500).optional(),
});

export const productModerateSchema = z.object({
  status: z.enum([
    'DRAFT',
    'PENDING_APPROVAL',
    'ACTIVE',
    'OUT_OF_STOCK',
    'SUSPENDED',
    'REJECTED',
    'ARCHIVED',
  ]),
  reason: z.string().max(500).optional(),
});

export const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const pageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  isPublished: z.boolean().optional(),
});

export const settingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});
