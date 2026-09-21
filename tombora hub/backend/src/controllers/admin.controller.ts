import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as adminService from '../services/admin.service';
import * as auditService from '../services/audit.service';
import {
  bannerSchema,
  pageSchema,
  productModerateSchema,
  sellerModerateSchema,
  settingSchema,
  userStatusSchema,
} from '../validators/admin.validator';

function clientIp(req: Request) {
  return req.ip || req.socket.remoteAddress;
}

export async function getDashboard(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const dashboard = await adminService.getDashboard();
  return success(res, { dashboard });
}

export async function listUsers(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const page = Math.max(1, Number(req.query.page) || 1);
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const data = await adminService.listUsers(page, 20, q);
  return success(res, data);
}

export async function updateUserStatus(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const { status } = userStatusSchema.parse(req.body);
  const user = await adminService.updateUserStatus(
    req.user.id,
    String(req.params.id),
    status,
    clientIp(req),
  );
  return success(res, { user }, 'User status updated');
}

export async function listSellers(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const page = Math.max(1, Number(req.query.page) || 1);
  const status =
    typeof req.query.status === 'string'
      ? (req.query.status as Parameters<typeof adminService.listSellers>[2])
      : undefined;
  const data = await adminService.listSellers(page, 20, status);
  return success(res, data);
}

export async function moderateSeller(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = sellerModerateSchema.parse(req.body);
  const seller = await adminService.moderateSeller(
    req.user.id,
    String(req.params.id),
    input.verificationStatus,
    input.reason,
    clientIp(req),
  );
  return success(res, { seller }, 'Seller updated');
}

export async function listProducts(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const page = Math.max(1, Number(req.query.page) || 1);
  const status =
    typeof req.query.status === 'string'
      ? (req.query.status as Parameters<typeof adminService.listProducts>[2])
      : undefined;
  const data = await adminService.listProducts(page, 20, status);
  return success(res, data);
}

export async function moderateProduct(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = productModerateSchema.parse(req.body);
  const product = await adminService.moderateProduct(
    req.user.id,
    String(req.params.id),
    input.status,
    input.reason,
    clientIp(req),
  );
  return success(res, { product }, 'Product updated');
}

export async function listOrders(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const page = Math.max(1, Number(req.query.page) || 1);
  const data = await adminService.listOrders(page);
  return success(res, data);
}

export async function listBanners(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true' || !req.user;
  const banners = await adminService.listBanners(activeOnly);
  return success(res, { banners });
}

export async function listPublicBanners(_req: Request, res: Response) {
  const banners = await adminService.listBanners(true);
  return success(res, { banners });
}

export async function upsertBanner(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = bannerSchema.parse(req.body);
  const banner = await adminService.upsertBanner(req.user.id, input, clientIp(req));
  return success(res, { banner }, 'Banner saved');
}

export async function listPages(_req: Request, res: Response) {
  const pages = await adminService.listPages();
  return success(res, { pages });
}

export async function upsertPage(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = pageSchema.parse(req.body);
  const page = await adminService.upsertPage(req.user.id, input, clientIp(req));
  return success(res, { page }, 'Page saved');
}

export async function getPublishedPage(req: Request, res: Response) {
  const page = await adminService.getPublishedPage(String(req.params.slug));
  return success(res, { page });
}

export async function listSettings(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const settings = await adminService.listSettings();
  return success(res, { settings });
}

export async function upsertSetting(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = settingSchema.parse(req.body);
  const setting = await adminService.upsertSetting(
    req.user.id,
    input.key,
    input.value,
    clientIp(req),
  );
  return success(res, { setting }, 'Setting saved');
}

export async function listAuditLogs(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const page = Math.max(1, Number(req.query.page) || 1);
  const data = await auditService.listAuditLogs(page);
  return success(res, data);
}
