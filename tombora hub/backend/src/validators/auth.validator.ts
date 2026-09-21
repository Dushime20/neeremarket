import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{9,15}$/, 'Invalid phone number')
      .optional(),
    password: z.string().min(8).max(128),
    role: z.enum(['CUSTOMER', 'SELLER']).default('CUSTOMER'),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Email or phone is required',
    path: ['email'],
  });

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Email or phone is required',
  });

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(20).max(4096),
  role: z.enum(['CUSTOMER', 'SELLER']).default('CUSTOMER'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
