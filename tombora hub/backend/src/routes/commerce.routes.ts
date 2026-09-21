import { Router } from 'express';
import * as commerceController from '../controllers/commerce.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';

export const cartRouter = Router();
cartRouter.use(requireAuth);
cartRouter.get('/', asyncHandler(commerceController.getCart));
cartRouter.post('/items', asyncHandler(commerceController.addCartItem));
cartRouter.patch('/items/:itemId', asyncHandler(commerceController.updateCartItem));
cartRouter.delete('/items/:itemId', asyncHandler(commerceController.removeCartItem));

export const addressRouter = Router();
addressRouter.use(requireAuth);
addressRouter.get('/', asyncHandler(commerceController.listAddresses));
addressRouter.post('/', asyncHandler(commerceController.createAddress));

export const checkoutRouter = Router();
checkoutRouter.use(requireAuth);
checkoutRouter.post('/', asyncHandler(commerceController.checkout));

export const orderRouter = Router();
orderRouter.use(requireAuth);
orderRouter.get('/', asyncHandler(commerceController.listOrders));
orderRouter.get('/:id', asyncHandler(commerceController.getOrder));
orderRouter.post('/:id/mock-pay', asyncHandler(commerceController.mockPay));

export const paymentRouter = Router();
paymentRouter.post(
  '/webhooks/:provider',
  asyncHandler(commerceController.paymentWebhook),
);

export const sellerOrderRouter = Router();
sellerOrderRouter.use(requireAuth, requireRole('SELLER', 'SUPER_ADMIN', 'ADMIN'));
sellerOrderRouter.get('/me/orders', asyncHandler(commerceController.listSellerOrders));
