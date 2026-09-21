import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' },
  },
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, asyncHandler(authController.register));
authRouter.post('/login', authLimiter, asyncHandler(authController.login));
authRouter.post('/google', authLimiter, asyncHandler(authController.google));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
