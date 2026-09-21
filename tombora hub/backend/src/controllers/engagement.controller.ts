import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as wishlistService from '../services/wishlist.service';
import * as reviewService from '../services/review.service';
import * as notificationService from '../services/notification.service';
import * as messagingService from '../services/messaging.service';
import {
  createReviewSchema,
  sendMessageSchema,
  wishlistItemSchema,
} from '../validators/engagement.validator';

export async function getWishlist(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const wishlist = await wishlistService.getWishlist(req.user.id);
  return success(res, { wishlist });
}

export async function addWishlistItem(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const { variantId } = wishlistItemSchema.parse(req.body);
  const wishlist = await wishlistService.addWishlistItem(req.user.id, variantId);
  return success(res, { wishlist }, 'Added to wishlist');
}

export async function removeWishlistItem(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const wishlist = await wishlistService.removeWishlistItem(
    req.user.id,
    String(req.params.variantId),
  );
  return success(res, { wishlist }, 'Removed from wishlist');
}

export async function createReview(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = createReviewSchema.parse(req.body);
  const review = await reviewService.createReview(req.user.id, input);
  return success(res, { review }, 'Review submitted', 201);
}

export async function listProductReviews(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const data = await reviewService.listProductReviews(String(req.params.productId), page);
  return success(res, data);
}

export async function markReviewHelpful(req: Request, res: Response) {
  const helpful = req.body?.helpful !== false;
  const review = await reviewService.markReviewHelpful(String(req.params.id), helpful);
  return success(res, { review });
}

export async function listNotifications(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const unreadOnly = req.query.unread === 'true';
  const data = await notificationService.listNotifications(req.user.id, unreadOnly);
  return success(res, data);
}

export async function markNotificationRead(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const data = await notificationService.markNotificationRead(
    req.user.id,
    String(req.params.id),
  );
  return success(res, data);
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const data = await notificationService.markAllNotificationsRead(req.user.id);
  return success(res, data);
}

export async function listThreads(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const all = req.query.scope === 'all' && messagingService.canManageInbox(req.user.roles);
  const data = await messagingService.listThreads(req.user.id, all);
  return success(res, data);
}

export async function getThread(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const asAdmin = req.query.scope === 'all' && messagingService.canManageInbox(req.user.roles);
  const data = await messagingService.getThreadMessages(
    req.user.id,
    String(req.params.id),
    asAdmin,
  );
  return success(res, data);
}

export async function sendMessage(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = sendMessageSchema.parse(req.body);
  const asAdmin = messagingService.canManageInbox(req.user.roles);
  const data = await messagingService.sendMessage(req.user.id, input, asAdmin);
  return success(res, data, 'Message sent', 201);
}
