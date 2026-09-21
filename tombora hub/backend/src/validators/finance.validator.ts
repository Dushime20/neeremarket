import { z } from 'zod';

export const payoutRequestSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(['MTN_MOMO', 'AIRTEL_MONEY', 'BANK']),
  destination: z.record(z.unknown()),
});

export const payoutReviewSchema = z.object({
  action: z.enum(['APPROVE', 'CANCEL']),
  notes: z.string().max(500).optional(),
});

export const sellerOrderStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED']),
});

export const createReturnSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum([
    'WRONG_PRODUCT',
    'DAMAGED_PRODUCT',
    'MISSING_ITEM',
    'WRONG_SIZE',
    'NOT_AS_DESCRIBED',
    'CHANGED_MIND',
    'OTHER',
  ]),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const reviewReturnSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().max(500).optional(),
});
