import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAuth, requirePermission, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../shared/middleware';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'SELLER_ADMIN', 'ORDER_ADMIN', 'CONTENT_ADMIN', 'CUSTOMER_SUPPORT'));

adminRouter.get(
  '/dashboard',
  requirePermission('orders.read', 'finance.read', 'sellers.approve'),
  asyncHandler(adminController.getDashboard),
);

adminRouter.get('/users', requirePermission('orders.read'), asyncHandler(adminController.listUsers));
adminRouter.get('/users/:id', requirePermission('orders.read'), asyncHandler(adminController.getUser));
adminRouter.patch(
  '/users/:id/status',
  requirePermission('sellers.suspend'),
  asyncHandler(adminController.updateUserStatus),
);

adminRouter.get(
  '/sellers',
  requirePermission('sellers.approve', 'sellers.suspend'),
  asyncHandler(adminController.listSellers),
);
adminRouter.get(
  '/sellers/:id',
  requirePermission('sellers.approve', 'sellers.suspend'),
  asyncHandler(adminController.getSeller),
);
adminRouter.post(
  '/sellers/:id/moderate',
  requirePermission('sellers.approve', 'sellers.suspend'),
  asyncHandler(adminController.moderateSeller),
);

adminRouter.get(
  '/products',
  requirePermission('products.approve'),
  asyncHandler(adminController.listProducts),
);
adminRouter.get(
  '/products/:id',
  requirePermission('products.approve'),
  asyncHandler(adminController.getProduct),
);
adminRouter.post(
  '/products/:id/moderate',
  requirePermission('products.approve'),
  asyncHandler(adminController.moderateProduct),
);

adminRouter.get('/orders', requirePermission('orders.read'), asyncHandler(adminController.listOrders));
adminRouter.get('/orders/:id', requirePermission('orders.read'), asyncHandler(adminController.getOrder));
adminRouter.post(
  '/orders/:id/seller-orders/:sellerOrderId/confirm-delivery',
  requirePermission('orders.update'),
  asyncHandler(adminController.confirmDelivery),
);

adminRouter.get('/cms/banners', requirePermission('cms.update'), asyncHandler(adminController.listBanners));
adminRouter.post('/cms/banners', requirePermission('cms.update'), asyncHandler(adminController.upsertBanner));
adminRouter.get('/cms/pages', requirePermission('cms.update'), asyncHandler(adminController.listPages));
adminRouter.post('/cms/pages', requirePermission('cms.update'), asyncHandler(adminController.upsertPage));

adminRouter.get(
  '/settings',
  requirePermission('settings.update', 'finance.read'),
  asyncHandler(adminController.listSettings),
);
adminRouter.put(
  '/settings',
  requirePermission('settings.update'),
  asyncHandler(adminController.upsertSetting),
);

adminRouter.get('/audit-logs/stats', requirePermission('audit.read'), asyncHandler(adminController.getAuditStats));
adminRouter.get('/audit-logs', requirePermission('audit.read'), asyncHandler(adminController.listAuditLogs));
adminRouter.get('/login-history', requirePermission('audit.read'), asyncHandler(adminController.listLoginHistory));

export const cmsPublicRouter = Router();
cmsPublicRouter.get('/pages/:slug', asyncHandler(adminController.getPublishedPage));
cmsPublicRouter.get('/banners', asyncHandler(adminController.listPublicBanners));
