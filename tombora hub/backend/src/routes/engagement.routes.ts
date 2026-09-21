import { Router } from 'express';
import * as engagementController from '../controllers/engagement.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';

export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);
wishlistRouter.get('/', asyncHandler(engagementController.getWishlist));
wishlistRouter.post('/items', asyncHandler(engagementController.addWishlistItem));
wishlistRouter.delete(
  '/items/:variantId',
  asyncHandler(engagementController.removeWishlistItem),
);

export const reviewRouter = Router();
reviewRouter.get(
  '/products/:productId/reviews',
  asyncHandler(engagementController.listProductReviews),
);
reviewRouter.post('/reviews', requireAuth, asyncHandler(engagementController.createReview));
reviewRouter.post(
  '/reviews/:id/helpful',
  requireAuth,
  asyncHandler(engagementController.markReviewHelpful),
);

export const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get('/', asyncHandler(engagementController.listNotifications));
notificationRouter.post(
  '/read-all',
  asyncHandler(engagementController.markAllNotificationsRead),
);
notificationRouter.post(
  '/:id/read',
  asyncHandler(engagementController.markNotificationRead),
);

export const messageRouter = Router();
messageRouter.use(requireAuth);
messageRouter.get('/threads', asyncHandler(engagementController.listThreads));
messageRouter.get('/threads/:id', asyncHandler(engagementController.getThread));
messageRouter.post('/', asyncHandler(engagementController.sendMessage));
