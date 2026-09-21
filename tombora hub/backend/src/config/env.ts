import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('NeereMarket'),
  APP_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:4000'),
  API_PREFIX: z.string().default('/api/v1'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COMMISSION_DEFAULT_RATE_BPS: z.coerce.number().default(1000),
  RETURN_WINDOW_DAYS: z.coerce.number().default(7),
  DEFAULT_CURRENCY: z.string().default('RWF'),
  PAYMENT_PROVIDER: z.string().default('mock'),
  STORAGE_PROVIDER: z.string().default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === 'production';
