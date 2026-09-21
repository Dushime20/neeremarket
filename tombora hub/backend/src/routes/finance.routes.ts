import { Router } from 'express';
import * as financeController from '../controllers/finance.controller';
import { requireAuth, requirePermission, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';

export const financeSellerRouter = Router();
financeSellerRouter.use(requireAuth, requireRole('SELLER', 'SUPER_ADMIN', 'ADMIN'));
financeSellerRouter.get('/me/finance', asyncHandler(financeController.getSellerFinance));
financeSellerRouter.post('/me/payouts', asyncHandler(financeController.requestPayout));
financeSellerRouter.get('/me/returns', asyncHandler(financeController.listSellerReturns));
financeSellerRouter.patch(
  '/me/orders/:id/status',
  asyncHandler(financeController.updateSellerOrderStatus),
);

export const returnsRouter = Router();
returnsRouter.use(requireAuth);
returnsRouter.post('/', asyncHandler(financeController.createReturn));
returnsRouter.get('/me', asyncHandler(financeController.listMyReturns));

export const adminFinanceRouter = Router();
adminFinanceRouter.use(requireAuth);
adminFinanceRouter.get(
  '/payouts',
  requirePermission('payouts.approve', 'finance.read'),
  asyncHandler(financeController.listAdminPayouts),
);
adminFinanceRouter.post(
  '/payouts/:id/review',
  requirePermission('payouts.approve'),
  asyncHandler(financeController.reviewPayout),
);
adminFinanceRouter.post(
  '/payouts/:id/process',
  requirePermission('payouts.approve'),
  asyncHandler(financeController.processPayout),
);
adminFinanceRouter.get(
  '/returns',
  requirePermission('payments.refund', 'orders.read'),
  asyncHandler(financeController.listAdminReturns),
);
adminFinanceRouter.post(
  '/returns/:id/review',
  requirePermission('payments.refund'),
  asyncHandler(financeController.reviewReturn),
);
