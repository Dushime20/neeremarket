import type { Express } from 'express';
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { healthRouter } from './health.routes';
import { catalogRouter } from './catalog.routes';
import { sellerRouter } from './seller.routes';
import {
  addressRouter,
  cartRouter,
  checkoutRouter,
  orderRouter,
  paymentRouter,
  sellerOrderRouter,
} from './commerce.routes';
import { adminFinanceRouter, financeSellerRouter, returnsRouter } from './finance.routes';
import {
  messageRouter,
  notificationRouter,
  reviewRouter,
  wishlistRouter,
} from './engagement.routes';
import { adminRouter, cmsPublicRouter } from './admin.routes';
import { env } from '../config/env';

export function registerRoutes(app: Express) {
  const api = Router();
  api.use('/health', healthRouter);
  api.use('/auth', authRouter);
  api.use('/sellers', sellerRouter);
  api.use('/sellers', sellerOrderRouter);
  api.use('/sellers', financeSellerRouter);
  api.use('/cart', cartRouter);
  api.use('/addresses', addressRouter);
  api.use('/checkout', checkoutRouter);
  api.use('/orders', orderRouter);
  api.use('/payments', paymentRouter);
  api.use('/returns', returnsRouter);
  api.use('/admin/finance', adminFinanceRouter);
  api.use('/admin', adminRouter);
  api.use('/cms', cmsPublicRouter);
  api.use('/wishlist', wishlistRouter);
  api.use('/notifications', notificationRouter);
  api.use('/messages', messageRouter);
  api.use('/', reviewRouter);
  api.use('/', catalogRouter);
  app.use(env.API_PREFIX, api);
}
