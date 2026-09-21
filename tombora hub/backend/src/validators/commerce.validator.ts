import { z } from 'zod';

export const addCartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(999),
});

export const createAddressSchema = z.object({
  label: z.string().max(60).optional(),
  fullName: z.string().min(2).max(120),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/),
  province: z.string().min(2),
  district: z.string().min(2),
  sector: z.string().optional(),
  cell: z.string().optional(),
  village: z.string().optional(),
  street: z.string().optional(),
  landmark: z.string().optional(),
  kgAddress: z.string().optional(),
  building: z.string().optional(),
  apartment: z.string().optional(),
  googleMapsUrl: z.string().url().optional(),
  instructions: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  deliveryMethod: z
    .enum(['SELLER_DELIVERY', 'PLATFORM_DELIVERY', 'THIRD_PARTY', 'CUSTOMER_PICKUP'])
    .default('SELLER_DELIVERY'),
  paymentMethod: z.enum(['MTN_MOMO', 'AIRTEL_MONEY', 'MOCK']).default('MOCK'),
  customerPhone: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(120),
});

export const paymentWebhookSchema = z.object({
  providerRef: z.string().min(1),
  status: z.enum(['PAID', 'FAILED', 'CANCELLED', 'PENDING']).default('PAID'),
  amount: z.number().optional(),
});
