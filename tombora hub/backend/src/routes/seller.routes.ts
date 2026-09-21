import { Router } from 'express';
import * as sellerController from '../controllers/seller.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';
import { mediaUpload } from '../services/upload.service';

export const sellerRouter = Router();

sellerRouter.use(requireAuth, requireRole('SELLER', 'SUPER_ADMIN', 'ADMIN'));

sellerRouter.get('/me', asyncHandler(sellerController.getMySeller));
sellerRouter.patch('/me', asyncHandler(sellerController.updateMySeller));
sellerRouter.get('/me/dashboard', asyncHandler(sellerController.getSellerDashboard));
sellerRouter.get('/me/onboarding', asyncHandler(sellerController.getOnboarding));
sellerRouter.post('/me/onboarding', asyncHandler(sellerController.saveOnboarding));
sellerRouter.get('/me/products', asyncHandler(sellerController.listMyProducts));
sellerRouter.get('/me/products/:id', asyncHandler(sellerController.getProduct));
sellerRouter.get('/me/inventory', asyncHandler(sellerController.listInventory));
sellerRouter.get('/me/reviews', asyncHandler(sellerController.listMyReviews));
sellerRouter.post('/me/products', asyncHandler(sellerController.createProduct));
sellerRouter.patch('/me/products/:id', asyncHandler(sellerController.updateProduct));
sellerRouter.delete('/me/products/:id', asyncHandler(sellerController.deleteProduct));
sellerRouter.post(
  '/me/uploads',
  mediaUpload.array('files', 8),
  asyncHandler(sellerController.uploadMedia),
);
sellerRouter.post(
  '/me/inventory/:variantId/adjust',
  asyncHandler(sellerController.adjustInventory),
);
