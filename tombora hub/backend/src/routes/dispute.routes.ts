import { Router } from 'express';
import * as disputeController from '../controllers/dispute.controller';
import { requireAuth, requirePermission, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';
import { mediaUpload } from '../services/upload.service';

export const disputeRouter = Router();
disputeRouter.use(requireAuth);
disputeRouter.post(
  '/uploads',
  mediaUpload.array('files', 6),
  asyncHandler(disputeController.uploadEvidence),
);
disputeRouter.post('/', asyncHandler(disputeController.createDispute));
disputeRouter.get('/me', asyncHandler(disputeController.listMyDisputes));
disputeRouter.get('/:id', asyncHandler(disputeController.getDispute));
disputeRouter.post('/:id/messages', asyncHandler(disputeController.postMessage));
disputeRouter.post('/:id/withdraw', asyncHandler(disputeController.withdrawDispute));

export const sellerDisputeRouter = Router();
sellerDisputeRouter.use(requireAuth, requireRole('SELLER', 'SUPER_ADMIN', 'ADMIN'));
sellerDisputeRouter.get('/me/disputes', asyncHandler(disputeController.listSellerDisputes));

export const adminDisputeRouter = Router();
adminDisputeRouter.use(requireAuth, requirePermission('disputes.manage', 'orders.read'));
adminDisputeRouter.get('/', asyncHandler(disputeController.listAdminDisputes));
adminDisputeRouter.post(
  '/:id/resolve',
  requirePermission('disputes.manage', 'orders.update'),
  asyncHandler(disputeController.resolveDispute),
);
