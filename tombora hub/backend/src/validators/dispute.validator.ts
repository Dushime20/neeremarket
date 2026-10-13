import { z } from 'zod';

export const DISPUTE_TYPES = [
  'SHIPPING_DELAY',
  'NOT_DELIVERED',
  'DAMAGED_ITEM',
  'WRONG_ITEM',
  'MISSING_ITEM',
  'NOT_AS_DESCRIBED',
  'PAYMENT_ISSUE',
  'SELLER_UNRESPONSIVE',
  'OTHER',
] as const;

export const DISPUTE_RESOLUTIONS = [
  'FULL_REFUND',
  'PARTIAL_REFUND',
  'REPLACEMENT',
  'REDELIVERY',
  'RETURN_AND_REFUND',
  'NO_ACTION',
  'OTHER',
] as const;

export const DISPUTE_STATUSES = [
  'OPEN',
  'SELLER_RESPONDED',
  'ESCALATED',
  'RESOLVED',
  'REJECTED',
  'WITHDRAWN',
] as const;

const httpUrl = z
  .string()
  .url()
  .max(1000)
  .refine((value) => /^https?:\/\//i.test(value), 'Only http(s) links are allowed');

export const createDisputeSchema = z.object({
  orderId: z.string().uuid(),
  sellerOrderId: z.string().uuid(),
  type: z.enum(DISPUTE_TYPES),
  subject: z.string().trim().min(4).max(140),
  description: z.string().trim().min(10).max(4000),
  desiredOutcome: z.enum(DISPUTE_RESOLUTIONS).optional(),
  evidenceUrls: z.array(httpUrl).max(8).default([]),
});

export const disputeMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  attachments: z.array(httpUrl).max(6).default([]),
});

export const disputeNoteSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const resolveDisputeSchema = z
  .object({
    outcome: z.enum(['RESOLVED', 'REJECTED']),
    resolution: z.enum(DISPUTE_RESOLUTIONS),
    note: z.string().trim().min(3).max(2000),
    refundAmount: z.number().int().positive().optional(),
  })
  .refine((v) => v.resolution !== 'PARTIAL_REFUND' || v.refundAmount !== undefined, {
    message: 'Partial refunds need an amount',
    path: ['refundAmount'],
  });

export const listDisputesQuerySchema = z.object({
  status: z.enum(DISPUTE_STATUSES).optional(),
  q: z.string().trim().max(80).optional(),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
