import { z } from 'zod';

export const wishlistItemSchema = z.object({
  variantId: z.string().uuid(),
});

export const createReviewSchema = z
  .object({
    productId: z.string().uuid().optional(),
    sellerId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    body: z.string().max(2000).optional(),
    images: z.array(z.string().url()).max(5).default([]),
  })
  .refine((d) => d.productId || d.sellerId, {
    message: 'productId or sellerId is required',
  });

export const sendMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  body: z.string().min(1).max(2000),
});
